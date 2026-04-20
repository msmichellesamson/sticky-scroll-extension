#!/usr/bin/env python3
"""
Pattern Prediction Cache Service
Caches ML model predictions for scroll patterns to reduce latency
"""

import asyncio
import json
import logging
from typing import Dict, Optional, List, Tuple
from dataclasses import dataclass
import redis.asyncio as redis
import hashlib
from datetime import datetime, timedelta

@dataclass
class PredictionCacheEntry:
    pattern_hash: str
    prediction: Dict
    confidence: float
    timestamp: datetime
    hit_count: int = 0

class PatternPredictionCache:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = redis.from_url(redis_url)
        self.logger = logging.getLogger(__name__)
        self.cache_ttl = 3600  # 1 hour
        self.max_entries = 10000
        
    async def _generate_pattern_hash(self, features: Dict) -> str:
        """Generate hash for scroll pattern features"""
        # Sort features for consistent hashing
        feature_str = json.dumps(features, sort_keys=True)
        return hashlib.sha256(feature_str.encode()).hexdigest()[:16]
    
    async def get_prediction(self, features: Dict) -> Optional[Tuple[Dict, float]]:
        """Get cached prediction for pattern features"""
        try:
            pattern_hash = await self._generate_pattern_hash(features)
            cached_data = await self.redis.hgetall(f"pred:{pattern_hash}")
            
            if not cached_data:
                return None
                
            # Update hit count
            await self.redis.hincrby(f"pred:{pattern_hash}", "hit_count", 1)
            
            prediction = json.loads(cached_data[b"prediction"].decode())
            confidence = float(cached_data[b"confidence"].decode())
            
            self.logger.info(f"Cache hit for pattern {pattern_hash[:8]}")
            return prediction, confidence
            
        except Exception as e:
            self.logger.error(f"Cache get error: {e}")
            return None
    
    async def cache_prediction(self, features: Dict, prediction: Dict, confidence: float):
        """Cache ML model prediction"""
        try:
            pattern_hash = await self._generate_pattern_hash(features)
            cache_key = f"pred:{pattern_hash}"
            
            cache_data = {
                "prediction": json.dumps(prediction),
                "confidence": str(confidence),
                "timestamp": datetime.utcnow().isoformat(),
                "hit_count": "0"
            }
            
            # Store with expiration
            await self.redis.hset(cache_key, mapping=cache_data)
            await self.redis.expire(cache_key, self.cache_ttl)
            
            # Track cache size
            await self.redis.sadd("cache:keys", pattern_hash)
            
            self.logger.debug(f"Cached prediction for pattern {pattern_hash[:8]}")
            
        except Exception as e:
            self.logger.error(f"Cache set error: {e}")
    
    async def get_cache_stats(self) -> Dict:
        """Get cache performance statistics"""
        try:
            total_keys = await self.redis.scard("cache:keys")
            return {
                "total_entries": total_keys,
                "max_entries": self.max_entries,
                "ttl_seconds": self.cache_ttl,
                "hit_rate": await self._calculate_hit_rate()
            }
        except Exception as e:
            self.logger.error(f"Stats error: {e}")
            return {}
    
    async def _calculate_hit_rate(self) -> float:
        """Calculate cache hit rate from recent entries"""
        # Sample recent entries for hit rate calculation
        keys = await self.redis.srandmember("cache:keys", 100)
        if not keys:
            return 0.0
        
        total_hits = 0
        for key in keys:
            hit_count = await self.redis.hget(f"pred:{key.decode()}", "hit_count")
            if hit_count:
                total_hits += int(hit_count.decode())
        
        return min(total_hits / len(keys), 1.0) if keys else 0.0
