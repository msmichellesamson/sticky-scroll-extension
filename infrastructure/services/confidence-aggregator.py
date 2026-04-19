#!/usr/bin/env python3

import asyncio
import json
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta

import redis.asyncio as redis
from prometheus_client import Histogram, Counter, Gauge

# Metrics
CONFIDENCE_AGGREGATION_TIME = Histogram('confidence_aggregation_duration_seconds')
CONFIDENCE_SCORE_GAUGE = Gauge('scroll_intent_confidence_score', ['session_id'])
AGGREGATION_ERRORS = Counter('confidence_aggregation_errors_total')

@dataclass
class ConfidenceInput:
    source: str  # 'velocity', 'pattern', 'momentum', 'behavior'
    score: float  # 0.0-1.0
    timestamp: datetime
    weight: float = 1.0

class ConfidenceAggregator:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = redis.from_url(redis_url)
        self.logger = logging.getLogger(__name__)
        
        # Source weights for weighted average
        self.source_weights = {
            'velocity': 0.3,
            'pattern': 0.25, 
            'momentum': 0.25,
            'behavior': 0.2
        }
        
    async def aggregate_confidence(self, session_id: str, inputs: List[ConfidenceInput]) -> float:
        """Aggregate multiple confidence scores into single value"""
        with CONFIDENCE_AGGREGATION_TIME.time():
            try:
                if not inputs:
                    return 0.5  # neutral confidence
                
                # Recent inputs get higher weight (temporal decay)
                now = datetime.utcnow()
                weighted_scores = []
                total_weight = 0.0
                
                for input_data in inputs:
                    # Time decay (scores older than 5s get reduced weight)
                    age_seconds = (now - input_data.timestamp).total_seconds()
                    time_weight = max(0.1, 1.0 - (age_seconds / 5.0))
                    
                    # Combined weight
                    source_weight = self.source_weights.get(input_data.source, 0.1)
                    final_weight = source_weight * time_weight * input_data.weight
                    
                    weighted_scores.append(input_data.score * final_weight)
                    total_weight += final_weight
                
                if total_weight == 0:
                    return 0.5
                    
                confidence = sum(weighted_scores) / total_weight
                confidence = max(0.0, min(1.0, confidence))  # clamp to [0,1]
                
                # Cache result
                await self._cache_confidence(session_id, confidence)
                CONFIDENCE_SCORE_GAUGE.labels(session_id=session_id).set(confidence)
                
                return confidence
                
            except Exception as e:
                AGGREGATION_ERRORS.inc()
                self.logger.error(f"Confidence aggregation failed: {e}")
                return 0.5
    
    async def _cache_confidence(self, session_id: str, confidence: float):
        """Cache confidence score with TTL"""
        try:
            key = f"confidence:{session_id}"
            await self.redis.setex(key, 10, json.dumps({
                'score': confidence,
                'timestamp': datetime.utcnow().isoformat()
            }))
        except Exception as e:
            self.logger.warning(f"Failed to cache confidence: {e}")