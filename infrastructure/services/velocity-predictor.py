from typing import Dict, List, Optional, Tuple
import numpy as np
from dataclasses import dataclass
import logging
from datetime import datetime, timedelta

@dataclass
class ScrollEvent:
    timestamp: float
    position: float
    velocity: float
    acceleration: float

class VelocityPredictor:
    """Predicts future scroll velocity based on historical patterns"""
    
    def __init__(self, window_size: int = 10, prediction_horizon: float = 0.5):
        self.window_size = window_size
        self.prediction_horizon = prediction_horizon
        self.history: List[ScrollEvent] = []
        self.logger = logging.getLogger(__name__)
        
    def add_scroll_event(self, timestamp: float, position: float, velocity: float) -> None:
        """Add new scroll event to history"""
        if len(self.history) > 0:
            dt = timestamp - self.history[-1].timestamp
            if dt > 0:
                acceleration = (velocity - self.history[-1].velocity) / dt
            else:
                acceleration = 0.0
        else:
            acceleration = 0.0
            
        event = ScrollEvent(timestamp, position, velocity, acceleration)
        self.history.append(event)
        
        # Keep only recent events
        if len(self.history) > self.window_size:
            self.history.pop(0)
    
    def predict_velocity(self) -> Optional[Dict[str, float]]:
        """Predict velocity after prediction_horizon seconds"""
        if len(self.history) < 3:
            return None
            
        try:
            # Linear regression on recent velocity trends
            recent_events = self.history[-5:]
            times = np.array([e.timestamp for e in recent_events])
            velocities = np.array([e.velocity for e in recent_events])
            
            # Normalize times
            times = times - times[0]
            
            if len(times) < 2:
                return None
                
            # Fit linear trend
            coeffs = np.polyfit(times, velocities, 1)
            
            # Predict future velocity
            future_time = times[-1] + self.prediction_horizon
            predicted_velocity = np.polyval(coeffs, future_time)
            
            # Calculate confidence based on trend consistency
            velocity_variance = np.var(velocities)
            confidence = max(0.1, min(0.9, 1.0 - (velocity_variance / 1000.0)))
            
            return {
                'predicted_velocity': float(predicted_velocity),
                'confidence': confidence,
                'trend_slope': float(coeffs[0]),
                'current_velocity': float(velocities[-1])
            }
            
        except Exception as e:
            self.logger.error(f"Velocity prediction failed: {e}")
            return None
    
    def get_momentum_score(self) -> float:
        """Calculate current scroll momentum (0-1)"""
        if len(self.history) < 2:
            return 0.0
            
        recent_velocities = [abs(e.velocity) for e in self.history[-3:]]
        avg_velocity = sum(recent_velocities) / len(recent_velocities)
        
        # Normalize to 0-1 range (assuming max velocity ~2000px/s)
        return min(1.0, avg_velocity / 2000.0)
