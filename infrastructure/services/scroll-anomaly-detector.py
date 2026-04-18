#!/usr/bin/env python3

import logging
import asyncio
import redis.asyncio as redis
from typing import Dict, List, Optional, Tuple
import numpy as np
from dataclasses import dataclass
import json
from datetime import datetime, timedelta

@dataclass
class ScrollAnomaly:
    timestamp: datetime
    anomaly_type: str
    severity: float
    context: Dict
    confidence: float

class ScrollAnomalyDetector:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.logger = logging.getLogger(__name__)
        self.anomaly_threshold = 2.5  # Standard deviations
        
    async def detect_velocity_anomalies(self, user_id: str, 
                                       current_velocity: float) -> Optional[ScrollAnomaly]:
        """Detect unusual scroll velocities based on user history"""
        try:
            # Get user's velocity history
            key = f"velocity_history:{user_id}"
            history = await self.redis.lrange(key, 0, 99)  # Last 100 values
            
            if len(history) < 10:
                return None  # Need baseline
                
            velocities = [float(v) for v in history]
            mean_vel = np.mean(velocities)
            std_vel = np.std(velocities)
            
            if std_vel == 0:
                return None
                
            z_score = abs(current_velocity - mean_vel) / std_vel
            
            if z_score > self.anomaly_threshold:
                return ScrollAnomaly(
                    timestamp=datetime.now(),
                    anomaly_type="velocity_spike",
                    severity=min(z_score / self.anomaly_threshold, 1.0),
                    context={
                        "current_velocity": current_velocity,
                        "mean_velocity": mean_vel,
                        "z_score": z_score
                    },
                    confidence=0.85
                )
                
        except Exception as e:
            self.logger.error(f"Velocity anomaly detection failed: {e}")
            
        return None
        
    async def detect_pattern_anomalies(self, user_id: str, 
                                      scroll_pattern: List[float]) -> Optional[ScrollAnomaly]:
        """Detect unusual scroll patterns using sequence analysis"""
        try:
            if len(scroll_pattern) < 5:
                return None
                
            # Calculate pattern complexity (entropy-like measure)
            direction_changes = sum(1 for i in range(1, len(scroll_pattern)) 
                                  if (scroll_pattern[i] > 0) != (scroll_pattern[i-1] > 0))
            
            complexity = direction_changes / len(scroll_pattern)
            
            # Get user's typical complexity
            key = f"pattern_complexity:{user_id}"
            history = await self.redis.lrange(key, 0, 49)
            
            if len(history) < 5:
                # Store current complexity
                await self.redis.lpush(key, complexity)
                await self.redis.ltrim(key, 0, 49)
                return None
                
            complexities = [float(c) for c in history]
            mean_complexity = np.mean(complexities)
            std_complexity = np.std(complexities)
            
            if std_complexity == 0:
                return None
                
            z_score = abs(complexity - mean_complexity) / std_complexity
            
            if z_score > self.anomaly_threshold:
                return ScrollAnomaly(
                    timestamp=datetime.now(),
                    anomaly_type="pattern_anomaly",
                    severity=min(z_score / self.anomaly_threshold, 1.0),
                    context={
                        "current_complexity": complexity,
                        "mean_complexity": mean_complexity,
                        "direction_changes": direction_changes,
                        "z_score": z_score
                    },
                    confidence=0.75
                )
                
        except Exception as e:
            self.logger.error(f"Pattern anomaly detection failed: {e}")
            
        return None