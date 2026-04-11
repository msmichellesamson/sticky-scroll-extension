#!/usr/bin/env python3

import numpy as np
from dataclasses import dataclass
from typing import List, Optional
import redis
import json
from sklearn.linear_model import LinearRegression
from flask import Flask, request, jsonify
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
redis_client = redis.Redis(host='redis', port=6379, db=0)

@dataclass
class ScrollData:
    timestamp: float
    position: float
    velocity: float
    acceleration: float

class MomentumPredictor:
    def __init__(self):
        self.model = LinearRegression()
        self.is_trained = False
        self.min_samples = 10
    
    def predict_momentum(self, scroll_history: List[ScrollData]) -> dict:
        """Predict scroll momentum and stopping position"""
        if len(scroll_history) < 3:
            return {"momentum": 0.0, "predicted_stop": 0.0, "confidence": 0.0}
        
        # Calculate momentum score based on velocity consistency
        velocities = [s.velocity for s in scroll_history[-5:]]
        accelerations = [s.acceleration for s in scroll_history[-5:]]
        
        momentum = self._calculate_momentum(velocities, accelerations)
        predicted_stop = self._predict_stop_position(scroll_history)
        confidence = self._calculate_confidence(scroll_history)
        
        return {
            "momentum": momentum,
            "predicted_stop": predicted_stop,
            "confidence": confidence,
            "decay_rate": self._calculate_decay_rate(velocities)
        }
    
    def _calculate_momentum(self, velocities: List[float], accelerations: List[float]) -> float:
        """Calculate momentum score (0-1)"""
        if not velocities:
            return 0.0
        
        avg_velocity = abs(np.mean(velocities))
        velocity_consistency = 1.0 - (np.std(velocities) / (abs(np.mean(velocities)) + 1e-6))
        
        # Higher momentum for consistent high velocity
        momentum = min(avg_velocity / 1000.0, 1.0) * max(velocity_consistency, 0.0)
        return float(np.clip(momentum, 0.0, 1.0))
    
    def _predict_stop_position(self, history: List[ScrollData]) -> float:
        """Predict where scrolling will stop"""
        if len(history) < 2:
            return history[-1].position if history else 0.0
        
        current = history[-1]
        if abs(current.velocity) < 10:  # Already slow
            return current.position
        
        # Simple physics: v = v0 + at, assume deceleration
        decel_rate = -0.8  # Estimated deceleration
        time_to_stop = -current.velocity / decel_rate if decel_rate != 0 else 0
        
        predicted_stop = current.position + (current.velocity * time_to_stop + 0.5 * decel_rate * time_to_stop**2)
        return float(predicted_stop)
    
    def _calculate_confidence(self, history: List[ScrollData]) -> float:
        """Calculate prediction confidence"""
        if len(history) < 3:
            return 0.0
        
        # Higher confidence with more data and consistent patterns
        data_factor = min(len(history) / 20.0, 1.0)
        
        velocities = [s.velocity for s in history[-5:]]
        velocity_stability = 1.0 - (np.std(velocities) / (abs(np.mean(velocities)) + 1e-6))
        
        return float(np.clip(data_factor * max(velocity_stability, 0.0), 0.0, 1.0))
    
    def _calculate_decay_rate(self, velocities: List[float]) -> float:
        """Calculate how quickly momentum is decaying"""
        if len(velocities) < 2:
            return 0.0
        
        # Calculate velocity change rate
        changes = [velocities[i] - velocities[i-1] for i in range(1, len(velocities))]
        return float(np.mean(changes)) if changes else 0.0

predictor = MomentumPredictor()

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        scroll_history = [
            ScrollData(**item) for item in data.get('scroll_history', [])
        ]
        
        prediction = predictor.predict_momentum(scroll_history)
        
        # Cache prediction
        cache_key = f"momentum:{data.get('session_id', 'default')}"
        redis_client.setex(cache_key, 60, json.dumps(prediction))
        
        logger.info(f"Momentum prediction: {prediction['momentum']:.3f}")
        return jsonify(prediction)
    
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "model_trained": predictor.is_trained})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5004, debug=False)