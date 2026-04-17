#!/usr/bin/env python3

import asyncio
import json
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import redis.asyncio as redis
import psycopg_pool

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ScrollBehavior(Enum):
    CASUAL_BROWSING = "casual_browsing"
    TARGETED_READING = "targeted_reading"
    RAPID_SCANNING = "rapid_scanning"
    DELIBERATE_NAVIGATION = "deliberate_navigation"
    DISTRACTED_SCROLLING = "distracted_scrolling"

@dataclass
class BehaviorFeatures:
    velocity_variance: float
    pause_frequency: float
    direction_changes: int
    session_duration: float
    scroll_distance: float
    dwell_time_avg: float

class BehaviorClassifier:
    def __init__(self, redis_url: str, db_pool: psycopg_pool.AsyncConnectionPool):
        self.redis = redis.from_url(redis_url)
        self.db_pool = db_pool
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        
    async def classify_behavior(self, features: BehaviorFeatures) -> Tuple[ScrollBehavior, float]:
        """Classify scroll behavior with confidence score"""
        if not self.is_trained:
            await self._train_model()
            
        feature_vector = np.array([[
            features.velocity_variance,
            features.pause_frequency,
            features.direction_changes,
            features.session_duration,
            features.scroll_distance,
            features.dwell_time_avg
        ]])
        
        scaled_features = self.scaler.transform(feature_vector)
        prediction = self.model.predict(scaled_features)[0]
        confidence = np.max(self.model.predict_proba(scaled_features))
        
        behavior = ScrollBehavior(prediction)
        await self._cache_classification(features, behavior, confidence)
        
        return behavior, confidence
    
    async def _train_model(self) -> None:
        """Train model from historical data"""
        async with self.db_pool.connection() as conn:
            cursor = await conn.execute("""
                SELECT velocity_variance, pause_frequency, direction_changes,
                       session_duration, scroll_distance, dwell_time_avg, behavior
                FROM scroll_behavior_training 
                WHERE created_at > NOW() - INTERVAL '30 days'
                LIMIT 10000
            """)
            rows = await cursor.fetchall()
            
        if len(rows) < 100:
            logger.warning("Insufficient training data, using defaults")
            return
            
        X = np.array([[r[0], r[1], r[2], r[3], r[4], r[5]] for r in rows])
        y = np.array([r[6] for r in rows])
        
        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)
        self.model.fit(X_scaled, y)
        self.is_trained = True
        
        logger.info(f"Model trained on {len(rows)} samples")
    
    async def _cache_classification(self, features: BehaviorFeatures, 
                                   behavior: ScrollBehavior, confidence: float) -> None:
        """Cache classification result"""
        cache_key = f"behavior:{hash(str(features))}"
        result = {"behavior": behavior.value, "confidence": confidence}
        await self.redis.setex(cache_key, 3600, json.dumps(result))

async def main():
    redis_client = redis.from_url("redis://localhost:6379")
    db_pool = psycopg_pool.AsyncConnectionPool(
        "postgresql://user:pass@localhost/scrolldb"
    )
    
    classifier = BehaviorClassifier("redis://localhost:6379", db_pool)
    
    # Example classification
    features = BehaviorFeatures(
        velocity_variance=0.25,
        pause_frequency=0.15,
        direction_changes=3,
        session_duration=45.0,
        scroll_distance=1200.0,
        dwell_time_avg=2.3
    )
    
    behavior, confidence = await classifier.classify_behavior(features)
    logger.info(f"Classified as {behavior.value} with {confidence:.2f} confidence")

if __name__ == "__main__":
    asyncio.run(main())