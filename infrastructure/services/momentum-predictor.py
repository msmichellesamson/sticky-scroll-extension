#!/usr/bin/env python3

import asyncio
import json
import logging
from typing import Dict, List, Optional
import numpy as np
from dataclasses import dataclass
from redis import Redis
from prometheus_client import Counter, Histogram, start_http_server

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Metrics
PREDICTIONS_TOTAL = Counter('momentum_predictions_total', 'Total momentum predictions')
PREDICTION_TIME = Histogram('momentum_prediction_duration_seconds', 'Time spent on predictions')
MOMENTUM_SCORE = Histogram('momentum_score', 'Predicted momentum scores', buckets=[0.1, 0.3, 0.5, 0.7, 0.9, 1.0])

@dataclass
class ScrollEvent:
    timestamp: float
    position: float
    velocity: float
    acceleration: float
    direction: str

class MomentumPredictor:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        self.momentum_threshold = 0.6
        self.velocity_decay = 0.85
        
    def calculate_momentum(self, events: List[ScrollEvent]) -> float:
        """Calculate scroll momentum based on velocity patterns"""
        if len(events) < 2:
            return 0.0
            
        # Calculate velocity consistency
        velocities = [abs(event.velocity) for event in events[-5:]]
        if not velocities:
            return 0.0
            
        avg_velocity = np.mean(velocities)
        velocity_std = np.std(velocities) if len(velocities) > 1 else 0
        
        # Momentum is high when velocity is consistent and above threshold
        consistency = 1.0 - min(velocity_std / max(avg_velocity, 1), 1.0)
        intensity = min(avg_velocity / 1000.0, 1.0)  # Normalize velocity
        
        momentum = (consistency * 0.7) + (intensity * 0.3)
        return min(momentum, 1.0)
    
    def predict_continuation(self, momentum: float, current_velocity: float) -> Dict:
        """Predict if scrolling will continue based on momentum"""
        will_continue = momentum > self.momentum_threshold and abs(current_velocity) > 50
        
        # Predict stopping distance
        if will_continue:
            stopping_distance = abs(current_velocity) * 2.5 * momentum
        else:
            stopping_distance = abs(current_velocity) * 0.5
            
        return {
            'will_continue': will_continue,
            'momentum_score': momentum,
            'stopping_distance': stopping_distance,
            'confidence': momentum * 0.8 + (0.2 if will_continue else 0)
        }
    
    async def process_scroll_data(self, user_id: str, scroll_data: Dict) -> Dict:
        """Process scroll events and predict momentum"""
        with PREDICTION_TIME.time():
            try:
                events = []
                for event_data in scroll_data.get('events', []):
                    events.append(ScrollEvent(
                        timestamp=event_data['timestamp'],
                        position=event_data['position'],
                        velocity=event_data.get('velocity', 0),
                        acceleration=event_data.get('acceleration', 0),
                        direction=event_data.get('direction', 'down')
                    ))
                
                momentum = self.calculate_momentum(events)
                current_velocity = events[-1].velocity if events else 0
                
                prediction = self.predict_continuation(momentum, current_velocity)
                
                # Store prediction in Redis
                key = f"momentum:{user_id}"
                await self.redis.setex(key, 300, json.dumps(prediction))  # 5min TTL
                
                PREDICTIONS_TOTAL.inc()
                MOMENTUM_SCORE.observe(momentum)
                
                logger.info(f"Momentum prediction for {user_id}: {momentum:.3f}")
                return prediction
                
            except Exception as e:
                logger.error(f"Momentum prediction error: {e}")
                return {'error': str(e), 'momentum_score': 0.0}

async def main():
    # Start Prometheus metrics server
    start_http_server(8003)
    
    redis_client = Redis(host='redis-service', port=6379, decode_responses=True)
    predictor = MomentumPredictor(redis_client)
    
    logger.info("Momentum predictor service started on port 8003")
    
    # Keep service running
    while True:
        await asyncio.sleep(60)

if __name__ == '__main__':
    asyncio.run(main())