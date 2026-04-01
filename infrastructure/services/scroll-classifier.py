#!/usr/bin/env python3

import asyncio
import json
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
from redis.asyncio import Redis
from prometheus_client import Counter, Histogram, start_http_server

# Metrics
CLASSIFICATIONS = Counter('scroll_classifications_total', ['pattern_type'])
CLASSIFICATION_LATENCY = Histogram('classification_duration_seconds')
ERRORS = Counter('classification_errors_total', ['error_type'])

@dataclass
class ScrollEvent:
    timestamp: float
    velocity: float
    direction: str
    position: float
    viewport_height: int

class PatternClassifier:
    def __init__(self, redis_url: str = 'redis://localhost:6379'):
        self.redis = Redis.from_url(redis_url)
        self.logger = logging.getLogger(__name__)
    
    def classify_pattern(self, events: List[ScrollEvent]) -> Dict[str, float]:
        """Classify scroll pattern using velocity and direction analysis"""
        if len(events) < 3:
            return {'unknown': 1.0}
        
        velocities = [abs(e.velocity) for e in events]
        directions = [e.direction for e in events]
        
        # Pattern detection logic
        avg_velocity = sum(velocities) / len(velocities)
        direction_changes = sum(1 for i in range(1, len(directions)) 
                             if directions[i] != directions[i-1])
        
        patterns = {
            'reading': 0.0,
            'skimming': 0.0, 
            'searching': 0.0,
            'bouncing': 0.0
        }
        
        # Classification rules
        if avg_velocity < 100 and direction_changes < len(events) * 0.2:
            patterns['reading'] = 0.8
        elif avg_velocity > 300 and direction_changes < len(events) * 0.3:
            patterns['skimming'] = 0.7
        elif direction_changes > len(events) * 0.5:
            patterns['searching'] = 0.6
        elif direction_changes > len(events) * 0.7:
            patterns['bouncing'] = 0.9
        else:
            patterns['reading'] = 0.5
        
        return patterns
    
    async def process_scroll_data(self, user_id: str, events_data: str):
        """Process scroll events and store classification"""
        try:
            with CLASSIFICATION_LATENCY.time():
                events_list = json.loads(events_data)
                events = [ScrollEvent(**e) for e in events_list]
                
                patterns = self.classify_pattern(events)
                dominant_pattern = max(patterns.items(), key=lambda x: x[1])
                
                # Store result in Redis
                result = {
                    'user_id': user_id,
                    'pattern': dominant_pattern[0],
                    'confidence': dominant_pattern[1],
                    'timestamp': events[-1].timestamp if events else 0
                }
                
                await self.redis.setex(
                    f'pattern:{user_id}', 
                    3600,  # 1 hour TTL
                    json.dumps(result)
                )
                
                CLASSIFICATIONS.labels(pattern_type=dominant_pattern[0]).inc()
                self.logger.info(f"Classified pattern for {user_id}: {dominant_pattern[0]}")
                
        except Exception as e:
            ERRORS.labels(error_type='classification_failed').inc()
            self.logger.error(f"Classification failed: {e}")

async def main():
    logging.basicConfig(level=logging.INFO)
    classifier = PatternClassifier()
    
    # Start Prometheus metrics server
    start_http_server(8000)
    
    # Simple message processing loop
    while True:
        try:
            # In production, this would consume from Kafka/PubSub
            await asyncio.sleep(1)
        except KeyboardInterrupt:
            break
    
    await classifier.redis.close()

if __name__ == '__main__':
    asyncio.run(main())
