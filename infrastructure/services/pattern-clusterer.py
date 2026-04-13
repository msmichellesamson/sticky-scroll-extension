#!/usr/bin/env python3
"""
Scroll Pattern Clustering Service
Groups similar scroll behaviors for adaptive threshold tuning
"""

import asyncio
import json
import logging
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from sklearn.cluster import DBSCAN
import numpy as np
import redis.asyncio as redis
from prometheus_client import Counter, Histogram, Gauge, start_http_server

# Metrics
PATTERN_CLUSTERS = Counter('pattern_clusters_created_total', 'Pattern clusters created')
CLUSTERING_TIME = Histogram('clustering_duration_seconds', 'Time spent clustering patterns')
ACTIVE_PATTERNS = Gauge('active_scroll_patterns_total', 'Number of active scroll patterns')

@dataclass
class ScrollPattern:
    velocity: float
    acceleration: float
    duration: float
    direction_changes: int
    timestamp: float
    user_id: str

class PatternClusterer:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = redis.from_url(redis_url)
        self.patterns: List[ScrollPattern] = []
        self.clusters: Dict[int, List[ScrollPattern]] = {}
        self.logger = logging.getLogger(__name__)
        
    async def add_pattern(self, pattern_data: Dict) -> None:
        """Add new scroll pattern for clustering"""
        try:
            pattern = ScrollPattern(**pattern_data)
            self.patterns.append(pattern)
            
            # Cluster when we have enough patterns
            if len(self.patterns) >= 50:
                await self._cluster_patterns()
                
        except Exception as e:
            self.logger.error(f"Failed to add pattern: {e}")
            
    async def _cluster_patterns(self) -> None:
        """Perform DBSCAN clustering on scroll patterns"""
        with CLUSTERING_TIME.time():
            try:
                # Extract features for clustering
                features = np.array([
                    [p.velocity, p.acceleration, p.duration, p.direction_changes]
                    for p in self.patterns
                ])
                
                # DBSCAN clustering
                clustering = DBSCAN(eps=0.3, min_samples=5).fit(features)
                
                # Group patterns by cluster
                self.clusters.clear()
                for i, label in enumerate(clustering.labels_):
                    if label not in self.clusters:
                        self.clusters[label] = []
                    self.clusters[label].append(self.patterns[i])
                
                # Store cluster info in Redis
                await self._store_clusters()
                
                # Update metrics
                PATTERN_CLUSTERS.inc(len(self.clusters))
                ACTIVE_PATTERNS.set(len(self.patterns))
                
                self.logger.info(f"Created {len(self.clusters)} clusters from {len(self.patterns)} patterns")
                
            except Exception as e:
                self.logger.error(f"Clustering failed: {e}")
                
    async def _store_clusters(self) -> None:
        """Store cluster information in Redis"""
        cluster_data = {}
        for cluster_id, patterns in self.clusters.items():
            if cluster_id == -1:  # Skip noise points
                continue
                
            # Calculate cluster statistics
            velocities = [p.velocity for p in patterns]
            cluster_data[f"cluster_{cluster_id}"] = {
                "size": len(patterns),
                "avg_velocity": np.mean(velocities),
                "velocity_std": np.std(velocities),
                "patterns": len(patterns)
            }
            
        await self.redis.set("scroll_clusters", json.dumps(cluster_data))
        
    async def get_cluster_thresholds(self, user_pattern: Dict) -> Optional[Dict]:
        """Get adaptive thresholds based on user's cluster"""
        try:
            # Simple cluster assignment based on velocity similarity
            user_velocity = user_pattern.get('velocity', 0)
            
            cluster_data = await self.redis.get("scroll_clusters")
            if not cluster_data:
                return None
                
            clusters = json.loads(cluster_data)
            
            # Find closest cluster
            closest_cluster = None
            min_distance = float('inf')
            
            for cluster_id, cluster_info in clusters.items():
                distance = abs(cluster_info['avg_velocity'] - user_velocity)
                if distance < min_distance:
                    min_distance = distance
                    closest_cluster = cluster_info
                    
            if closest_cluster:
                return {
                    "velocity_threshold": closest_cluster['avg_velocity'] * 1.2,
                    "confidence_boost": min(0.2, closest_cluster['size'] / 100)
                }
                
        except Exception as e:
            self.logger.error(f"Failed to get cluster thresholds: {e}")
            
        return None

async def main():
    logging.basicConfig(level=logging.INFO)
    
    # Start Prometheus metrics server
    start_http_server(8003)
    
    clusterer = PatternClusterer()
    
    # Listen for pattern data
    while True:
        try:
            # In real implementation, would consume from message queue
            await asyncio.sleep(30)  # Placeholder
        except KeyboardInterrupt:
            break
        except Exception as e:
            logging.error(f"Service error: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())
