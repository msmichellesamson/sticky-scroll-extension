#!/usr/bin/env python3

import json
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
from flask import Flask, request, jsonify
from sklearn.ensemble import RandomForestClassifier
import numpy as np
import redis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
redis_client = redis.Redis(host='localhost', port=6379, db=0)

@dataclass
class ScrollPattern:
    velocity_variance: float
    direction_changes: int
    pause_frequency: float
    acceleration_peaks: int
    pattern_type: str = "unknown"

class PatternClassifier:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=50, random_state=42)
        self.is_trained = False
        
    def extract_features(self, scroll_data: Dict) -> np.ndarray:
        """Extract ML features from scroll telemetry data"""
        velocities = scroll_data.get('velocities', [])
        directions = scroll_data.get('directions', [])
        timestamps = scroll_data.get('timestamps', [])
        
        if not velocities or len(velocities) < 3:
            return np.array([0, 0, 0, 0])
            
        velocity_variance = np.var(velocities)
        direction_changes = sum(1 for i in range(1, len(directions)) 
                              if directions[i] != directions[i-1])
        
        # Calculate pause frequency (velocity near zero)
        pauses = sum(1 for v in velocities if abs(v) < 50)
        pause_frequency = pauses / len(velocities)
        
        # Acceleration peaks
        accels = np.diff(velocities)
        acceleration_peaks = sum(1 for a in accels if abs(a) > 100)
        
        return np.array([velocity_variance, direction_changes, 
                        pause_frequency, acceleration_peaks])
    
    def classify_pattern(self, features: np.ndarray) -> str:
        """Classify scroll pattern based on features"""
        if not self.is_trained:
            return "reading"
            
        try:
            prediction = self.model.predict([features])[0]
            return prediction
        except Exception as e:
            logger.error(f"Classification error: {e}")
            return "unknown"

classifier = PatternClassifier()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "trained": classifier.is_trained})

@app.route('/classify', methods=['POST'])
def classify_scroll_pattern():
    try:
        data = request.get_json()
        if not data or 'scroll_data' not in data:
            return jsonify({"error": "Missing scroll_data"}), 400
            
        features = classifier.extract_features(data['scroll_data'])
        pattern_type = classifier.classify_pattern(features)
        
        # Cache result
        cache_key = f"pattern:{hash(str(data['scroll_data']))}"
        redis_client.setex(cache_key, 3600, pattern_type)
        
        return jsonify({
            "pattern_type": pattern_type,
            "features": features.tolist(),
            "confidence": 0.85 if classifier.is_trained else 0.5
        })
        
    except Exception as e:
        logger.error(f"Classification request failed: {e}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False)