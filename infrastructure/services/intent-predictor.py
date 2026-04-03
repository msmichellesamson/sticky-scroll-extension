#!/usr/bin/env python3

import numpy as np
from typing import Dict, List, Tuple
import logging
from dataclasses import dataclass
import asyncio
import redis.asyncio as redis
from prometheus_client import Counter, Histogram, start_http_server

@dataclass
class ScrollEvent:
    velocity: float
    acceleration: float
    direction: int
    timestamp: float
    page_height: int
    viewport_height: int

class IntentPredictor:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.prediction_counter = Counter('intent_predictions_total', ['intent_type'])
        self.prediction_latency = Histogram('intent_prediction_seconds')
        
    async def predict_intent(self, events: List[ScrollEvent]) -> Dict[str, float]:
        """Predict user scroll intent based on recent events"""
        with self.prediction_latency.time():
            if len(events) < 3:
                return {'uncertain': 1.0}
            
            # Feature extraction
            velocities = [e.velocity for e in events[-5:]]
            accelerations = [e.acceleration for e in events[-5:]]
            
            avg_velocity = np.mean(velocities)
            velocity_trend = np.polyfit(range(len(velocities)), velocities, 1)[0]
            acceleration_variance = np.var(accelerations)
            
            # Simple rule-based prediction
            intents = {
                'reading': self._calculate_reading_probability(avg_velocity, velocity_trend),
                'scanning': self._calculate_scanning_probability(avg_velocity, acceleration_variance),
                'seeking': self._calculate_seeking_probability(velocity_trend, acceleration_variance)
            }
            
            # Normalize probabilities
            total = sum(intents.values())
            if total > 0:
                intents = {k: v/total for k, v in intents.items()}
            
            # Record metrics
            dominant_intent = max(intents.keys(), key=lambda k: intents[k])
            self.prediction_counter.labels(intent_type=dominant_intent).inc()
            
            return intents
    
    def _calculate_reading_probability(self, avg_velocity: float, trend: float) -> float:
        """Reading: slow, steady scroll"""
        if 0 < avg_velocity < 50 and abs(trend) < 10:
            return 0.8
        return 0.1
    
    def _calculate_scanning_probability(self, avg_velocity: float, variance: float) -> float:
        """Scanning: variable speed, high variance"""
        if avg_velocity > 30 and variance > 100:
            return 0.7
        return 0.2
    
    def _calculate_seeking_probability(self, trend: float, variance: float) -> float:
        """Seeking: accelerating scroll"""
        if abs(trend) > 20 and variance > 200:
            return 0.9
        return 0.1

async def main():
    redis_client = await redis.from_url('redis://localhost:6379')
    predictor = IntentPredictor(redis_client)
    
    # Start Prometheus metrics server
    start_http_server(8003)
    
    # Health check endpoint would go here
    logging.info("Intent predictor service started")
    
    # Keep service running
    await asyncio.Event().wait()

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
