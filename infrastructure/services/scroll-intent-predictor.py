#!/usr/bin/env python3
"""
Scroll Intent Prediction Service
Predicts user scroll intentions based on velocity and pattern data.
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
import numpy as np
from redis import Redis
from prometheus_client import Counter, Histogram, start_http_server

# Metrics
prediction_counter = Counter('scroll_intent_predictions_total', 'Total intent predictions')
prediction_latency = Histogram('scroll_intent_prediction_duration_seconds', 'Prediction latency')

@dataclass
class ScrollEvent:
    velocity: float
    direction: str
    pattern_score: float
    context: str
    timestamp: float

class IntentPredictor:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        self.logger = logging.getLogger(__name__)
        
    def extract_features(self, events: List[ScrollEvent]) -> np.ndarray:
        """Extract ML features from scroll events"""
        if not events:
            return np.zeros(6)
            
        velocities = [e.velocity for e in events]
        patterns = [e.pattern_score for e in events]
        
        return np.array([
            np.mean(velocities),
            np.std(velocities),
            np.max(velocities),
            np.mean(patterns),
            len(events),
            sum(1 for e in events if e.direction == 'down') / len(events)
        ])
    
    def predict_intent(self, features: np.ndarray) -> Dict[str, float]:
        """Simple rule-based intent prediction"""
        avg_vel, vel_std, max_vel, avg_pattern, event_count, down_ratio = features
        
        # Intent probabilities
        intents = {
            'reading': 0.0,
            'searching': 0.0,
            'skimming': 0.0,
            'navigating': 0.0
        }
        
        # Reading: steady, moderate velocity
        if 50 <= avg_vel <= 200 and vel_std < 50:
            intents['reading'] = 0.7 + min(0.3, avg_pattern)
            
        # Searching: high velocity, variable
        elif avg_vel > 300 or vel_std > 100:
            intents['searching'] = 0.6 + min(0.4, vel_std / 200)
            
        # Skimming: fast, mostly downward
        elif avg_vel > 150 and down_ratio > 0.8:
            intents['skimming'] = 0.5 + min(0.5, down_ratio)
            
        # Navigating: mixed direction, short bursts
        else:
            intents['navigating'] = 0.4 + min(0.6, (1 - down_ratio))
            
        return intents
    
    async def process_scroll_data(self, session_id: str) -> Optional[Dict]:
        """Process scroll data and predict intent"""
        try:
            with prediction_latency.time():
                # Get recent scroll events
                events_data = self.redis.lrange(f"scroll:{session_id}", 0, 19)
                
                if not events_data:
                    return None
                    
                events = []
                for event_json in events_data:
                    data = json.loads(event_json)
                    events.append(ScrollEvent(**data))
                    
                features = self.extract_features(events)
                intents = self.predict_intent(features)
                
                # Store prediction
                prediction = {
                    'session_id': session_id,
                    'intents': intents,
                    'confidence': max(intents.values()),
                    'features': features.tolist()
                }
                
                self.redis.setex(
                    f"intent:{session_id}", 
                    300,  # 5 min TTL
                    json.dumps(prediction)
                )
                
                prediction_counter.inc()
                return prediction
                
        except Exception as e:
            self.logger.error(f"Intent prediction error: {e}")
            return None

async def main():
    logging.basicConfig(level=logging.INFO)
    
    # Start metrics server
    start_http_server(8003)
    
    redis_client = Redis(host='redis', port=6379, decode_responses=True)
    predictor = IntentPredictor(redis_client)
    
    logger = logging.getLogger(__name__)
    logger.info("Scroll intent predictor started")
    
    while True:
        try:
            # Process active sessions
            session_keys = redis_client.keys("scroll:*")
            
            for key in session_keys:
                session_id = key.replace("scroll:", "")
                await predictor.process_scroll_data(session_id)
                
            await asyncio.sleep(2)  # Process every 2 seconds
            
        except Exception as e:
            logger.error(f"Main loop error: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())