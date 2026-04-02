#!/usr/bin/env python3

import asyncio
import json
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta

import redis.asyncio as redis
import numpy as np
from sklearn.ensemble import IsolationForest


@dataclass
class ScrollAnomaly:
    user_id: str
    timestamp: datetime
    anomaly_score: float
    features: Dict[str, float]
    event_type: str  # 'velocity_spike', 'pattern_break', 'frequency_anomaly'


class AnomalyDetector:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = redis.from_url(redis_url)
        self.model = IsolationForest(contamination=0.1, random_state=42)
        self.logger = logging.getLogger(__name__)
        self.is_trained = False
        
    async def collect_features(self, user_id: str, window_minutes: int = 10) -> Optional[Dict[str, float]]:
        """Extract features from recent scroll events for anomaly detection."""
        try:
            end_time = datetime.now()
            start_time = end_time - timedelta(minutes=window_minutes)
            
            # Get scroll events from Redis
            events_key = f"scroll_events:{user_id}"
            events = await self.redis.zrangebyscore(
                events_key, 
                start_time.timestamp(), 
                end_time.timestamp(),
                withscores=True
            )
            
            if len(events) < 5:  # Need minimum events
                return None
                
            velocities = []
            intervals = []
            directions = []
            
            for i, (event_data, timestamp) in enumerate(events):
                event = json.loads(event_data)
                velocities.append(abs(event.get('velocity', 0)))
                directions.append(1 if event.get('direction') == 'down' else -1)
                
                if i > 0:
                    interval = timestamp - events[i-1][1]
                    intervals.append(interval)
            
            if not velocities or not intervals:
                return None
                
            return {
                'avg_velocity': np.mean(velocities),
                'max_velocity': np.max(velocities),
                'velocity_std': np.std(velocities),
                'avg_interval': np.mean(intervals),
                'interval_std': np.std(intervals),
                'direction_changes': sum(1 for i in range(1, len(directions)) 
                                       if directions[i] != directions[i-1]),
                'event_count': len(events),
                'velocity_95th': np.percentile(velocities, 95)
            }
            
        except Exception as e:
            self.logger.error(f"Failed to collect features for {user_id}: {e}")
            return None
    
    async def detect_anomaly(self, user_id: str) -> Optional[ScrollAnomaly]:
        """Detect if current scroll behavior is anomalous."""
        features = await self.collect_features(user_id)
        if not features or not self.is_trained:
            return None
            
        try:
            feature_vector = np.array([list(features.values())])
            anomaly_score = self.model.decision_function(feature_vector)[0]
            is_anomaly = self.model.predict(feature_vector)[0] == -1
            
            if is_anomaly:
                event_type = self._classify_anomaly_type(features)
                return ScrollAnomaly(
                    user_id=user_id,
                    timestamp=datetime.now(),
                    anomaly_score=anomaly_score,
                    features=features,
                    event_type=event_type
                )
                
        except Exception as e:
            self.logger.error(f"Anomaly detection failed for {user_id}: {e}")
            
        return None
    
    def _classify_anomaly_type(self, features: Dict[str, float]) -> str:
        """Classify the type of anomaly based on feature values."""
        if features['max_velocity'] > features['avg_velocity'] * 3:
            return 'velocity_spike'
        elif features['direction_changes'] > features['event_count'] * 0.7:
            return 'pattern_break'
        else:
            return 'frequency_anomaly'


async def main():
    detector = AnomalyDetector()
    
    while True:
        # Check for anomalies every 30 seconds
        await asyncio.sleep(30)
        
        # Get active users from Redis
        active_users = await detector.redis.smembers("active_users")
        
        for user_id in active_users:
            user_id = user_id.decode('utf-8')
            anomaly = await detector.detect_anomaly(user_id)
            
            if anomaly:
                logging.info(f"Anomaly detected: {anomaly}")
                # Store anomaly for alerting
                await detector.redis.lpush(
                    "scroll_anomalies", 
                    json.dumps({
                        'user_id': anomaly.user_id,
                        'timestamp': anomaly.timestamp.isoformat(),
                        'score': anomaly.anomaly_score,
                        'type': anomaly.event_type
                    })
                )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
