#!/usr/bin/env python3

import numpy as np
from typing import List, Tuple, Optional
from dataclasses import dataclass
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ScrollEvent:
    timestamp: float
    position: int
    velocity: float
    acceleration: float

@dataclass
class MomentumPrediction:
    predicted_position: float
    confidence: float
    decay_factor: float
    time_horizon: float

class MomentumCalculator:
    """Calculates scroll momentum and predicts future scroll positions."""
    
    def __init__(self, decay_rate: float = 0.95, min_events: int = 3):
        self.decay_rate = decay_rate
        self.min_events = min_events
        self.scroll_history: List[ScrollEvent] = []
        self.max_history = 20
    
    def add_scroll_event(self, position: int, velocity: float, acceleration: float) -> None:
        """Add a new scroll event to the history."""
        event = ScrollEvent(
            timestamp=time.time(),
            position=position,
            velocity=velocity,
            acceleration=acceleration
        )
        
        self.scroll_history.append(event)
        
        # Keep only recent events
        if len(self.scroll_history) > self.max_history:
            self.scroll_history = self.scroll_history[-self.max_history:]
    
    def calculate_momentum(self) -> float:
        """Calculate current scroll momentum based on recent events."""
        if len(self.scroll_history) < 2:
            return 0.0
        
        # Weight recent events more heavily
        weights = np.array([self.decay_rate ** (len(self.scroll_history) - i - 1) 
                           for i in range(len(self.scroll_history))])
        
        velocities = np.array([event.velocity for event in self.scroll_history])
        accelerations = np.array([event.acceleration for event in self.scroll_history])
        
        # Momentum combines velocity and acceleration trends
        velocity_momentum = np.average(velocities, weights=weights)
        accel_momentum = np.average(accelerations, weights=weights)
        
        return velocity_momentum + (0.3 * accel_momentum)
    
    def predict_position(self, time_horizon: float = 0.5) -> Optional[MomentumPrediction]:
        """Predict scroll position after given time horizon."""
        if len(self.scroll_history) < self.min_events:
            return None
        
        current_event = self.scroll_history[-1]
        momentum = self.calculate_momentum()
        
        # Simple physics-based prediction with momentum decay
        predicted_position = (
            current_event.position + 
            (momentum * time_horizon) + 
            (0.5 * current_event.acceleration * time_horizon ** 2)
        )
        
        # Calculate confidence based on consistency of recent events
        recent_velocities = [e.velocity for e in self.scroll_history[-5:]]
        velocity_std = np.std(recent_velocities) if len(recent_velocities) > 1 else 0
        confidence = max(0.1, min(1.0, 1.0 - (velocity_std / 1000.0)))
        
        return MomentumPrediction(
            predicted_position=predicted_position,
            confidence=confidence,
            decay_factor=self.decay_rate,
            time_horizon=time_horizon
        )
    
    def reset(self) -> None:
        """Reset scroll history."""
        self.scroll_history.clear()
        logger.info("Momentum calculator reset")

if __name__ == "__main__":
    # Example usage
    calc = MomentumCalculator()
    
    # Simulate scroll events
    positions = [100, 120, 150, 190, 240]
    velocities = [20, 30, 40, 50, 45]
    accelerations = [10, 10, 10, -5, -10]
    
    for pos, vel, acc in zip(positions, velocities, accelerations):
        calc.add_scroll_event(pos, vel, acc)
        prediction = calc.predict_position(0.5)
        if prediction:
            print(f"Position: {pos}, Predicted: {prediction.predicted_position:.1f}, Confidence: {prediction.confidence:.2f}")