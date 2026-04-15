#!/usr/bin/env python3

import redis
import json
import hashlib
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

class PredictionCache:
    """Redis-based cache for ML model predictions to reduce inference latency."""
    
    def __init__(self, redis_host='localhost', redis_port=6379, ttl_seconds=300):
        self.redis_client = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)
        self.ttl = ttl_seconds
        self.cache_prefix = "scroll_prediction:"
    
    def _generate_cache_key(self, features: Dict[str, Any]) -> str:
        """Generate deterministic cache key from feature vector."""
        feature_string = json.dumps(features, sort_keys=True)
        hash_obj = hashlib.md5(feature_string.encode())
        return f"{self.cache_prefix}{hash_obj.hexdigest()}"
    
    def get_prediction(self, features: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Retrieve cached prediction for given features."""
        try:
            cache_key = self._generate_cache_key(features)
            cached_result = self.redis_client.get(cache_key)
            
            if cached_result:
                return json.loads(cached_result)
            return None
            
        except Exception as e:
            print(f"Cache retrieval error: {e}")
            return None
    
    def store_prediction(self, features: Dict[str, Any], prediction: Dict[str, Any]) -> bool:
        """Store prediction result with TTL."""
        try:
            cache_key = self._generate_cache_key(features)
            
            cache_value = {
                'prediction': prediction,
                'timestamp': datetime.utcnow().isoformat(),
                'ttl': self.ttl
            }
            
            self.redis_client.setex(
                cache_key, 
                self.ttl, 
                json.dumps(cache_value)
            )
            return True
            
        except Exception as e:
            print(f"Cache storage error: {e}")
            return False
    
    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate cache entries matching pattern."""
        try:
            keys = self.redis_client.keys(f"{self.cache_prefix}{pattern}*")
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            print(f"Cache invalidation error: {e}")
            return 0
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache performance metrics."""
        try:
            info = self.redis_client.info()
            key_count = len(self.redis_client.keys(f"{self.cache_prefix}*"))
            
            return {
                'connected_clients': info.get('connected_clients', 0),
                'used_memory_human': info.get('used_memory_human', '0B'),
                'cache_keys': key_count,
                'keyspace_hits': info.get('keyspace_hits', 0),
                'keyspace_misses': info.get('keyspace_misses', 0)
            }
        except Exception as e:
            print(f"Stats retrieval error: {e}")
            return {}

if __name__ == "__main__":
    cache = PredictionCache()
    
    # Test cache functionality
    test_features = {'velocity': 150, 'direction': 'down', 'momentum': 0.8}
    test_prediction = {'intent': 'scroll_to_bottom', 'confidence': 0.92}
    
    # Store and retrieve
    cache.store_prediction(test_features, test_prediction)
    cached = cache.get_prediction(test_features)
    
    print(f"Cache test: {cached}")
    print(f"Stats: {cache.get_cache_stats()}")