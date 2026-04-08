import asyncio
import redis.asyncio as redis
import json
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MomentumPredictor:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.momentum_threshold = 0.3
        self.deceleration_factor = 0.85
        
    async def predict_momentum(self, user_id: str, velocity_data: List[float]) -> Dict:
        """Predict scroll momentum and stopping point"""
        if len(velocity_data) < 3:
            return {"momentum": 0.0, "predicted_stop": 0, "confidence": 0.0}
            
        # Calculate momentum using velocity decay
        current_velocity = velocity_data[-1]
        velocity_trend = np.diff(velocity_data[-5:]) if len(velocity_data) >= 5 else [0]
        
        # Momentum based on velocity and acceleration
        momentum = abs(current_velocity) * (1 + np.mean(velocity_trend))
        
        # Predict stopping point using physics-based decay
        predicted_stop = self._calculate_stop_distance(current_velocity, velocity_trend)
        
        # Confidence based on velocity stability
        confidence = min(1.0, abs(current_velocity) / 100.0)
        
        # Store prediction for analytics
        await self._store_prediction(user_id, momentum, predicted_stop, confidence)
        
        return {
            "momentum": round(momentum, 3),
            "predicted_stop": int(predicted_stop),
            "confidence": round(confidence, 3),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _calculate_stop_distance(self, velocity: float, trend: List[float]) -> float:
        """Calculate predicted stopping distance using momentum decay"""
        if abs(velocity) < 1.0:
            return 0
            
        # Apply deceleration until velocity reaches near zero
        distance = 0
        current_v = velocity
        
        while abs(current_v) > 1.0:
            distance += current_v * 0.016  # ~60fps frame time
            current_v *= self.deceleration_factor
            
        return distance
    
    async def _store_prediction(self, user_id: str, momentum: float, stop: float, confidence: float):
        """Store momentum prediction for analytics"""
        try:
            key = f"momentum:{user_id}:{int(datetime.utcnow().timestamp())}"
            data = {"momentum": momentum, "predicted_stop": stop, "confidence": confidence}
            await self.redis.setex(key, 3600, json.dumps(data))  # 1 hour TTL
        except Exception as e:
            logger.error(f"Failed to store momentum prediction: {e}")

async def main():
    redis_client = redis.Redis(host='redis-service', port=6379, decode_responses=True)
    predictor = MomentumPredictor(redis_client)
    
    # Example usage
    test_velocity = [50.0, 45.0, 38.0, 30.0, 22.0]
    result = await predictor.predict_momentum("test_user", test_velocity)
    logger.info(f"Momentum prediction: {result}")

if __name__ == "__main__":
    asyncio.run(main())