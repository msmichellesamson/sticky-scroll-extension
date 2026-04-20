#!/usr/bin/env python3
"""Session Clustering Service - Groups scroll sessions by behavior patterns"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import numpy as np
import redis.asyncio as redis
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ScrollSession:
    user_id: str
    session_id: str
    avg_velocity: float
    scroll_count: int
    pause_frequency: float
    direction_changes: int
    session_duration: float
    timestamp: datetime

class SessionClusterer:
    """Clusters scroll sessions to identify user behavior patterns"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379", n_clusters: int = 5):
        self.redis_client = None
        self.redis_url = redis_url
        self.n_clusters = n_clusters
        self.scaler = StandardScaler()
        self.kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        self.feature_names = [
            'avg_velocity', 'scroll_count', 'pause_frequency', 
            'direction_changes', 'session_duration'
        ]
    
    async def connect(self):
        """Connect to Redis"""
        self.redis_client = redis.from_url(self.redis_url)
        logger.info("Connected to Redis")
    
    async def get_recent_sessions(self, hours: int = 24) -> List[ScrollSession]:
        """Fetch recent scroll sessions from Redis"""
        cutoff = datetime.now() - timedelta(hours=hours)
        session_keys = await self.redis_client.keys("session:*")
        
        sessions = []
        for key in session_keys:
            data = await self.redis_client.hgetall(key)
            if not data:
                continue
                
            session = ScrollSession(
                user_id=data.get(b'user_id', b'').decode(),
                session_id=data.get(b'session_id', b'').decode(),
                avg_velocity=float(data.get(b'avg_velocity', 0)),
                scroll_count=int(data.get(b'scroll_count', 0)),
                pause_frequency=float(data.get(b'pause_frequency', 0)),
                direction_changes=int(data.get(b'direction_changes', 0)),
                session_duration=float(data.get(b'session_duration', 0)),
                timestamp=datetime.fromisoformat(data.get(b'timestamp', b'').decode())
            )
            
            if session.timestamp >= cutoff:
                sessions.append(session)
        
        return sessions
    
    def extract_features(self, sessions: List[ScrollSession]) -> np.ndarray:
        """Extract feature matrix from sessions"""
        if not sessions:
            return np.array([])
            
        features = []
        for session in sessions:
            feature_vector = [
                session.avg_velocity,
                session.scroll_count,
                session.pause_frequency,
                session.direction_changes,
                session.session_duration
            ]
            features.append(feature_vector)
        
        return np.array(features)
    
    async def cluster_sessions(self) -> Dict[str, List[str]]:
        """Cluster recent sessions and return cluster assignments"""
        sessions = await self.get_recent_sessions()
        if len(sessions) < self.n_clusters:
            logger.warning(f"Not enough sessions ({len(sessions)}) for clustering")
            return {}
        
        features = self.extract_features(sessions)
        scaled_features = self.scaler.fit_transform(features)
        
        cluster_labels = self.kmeans.fit_predict(scaled_features)
        
        # Group sessions by cluster
        clusters = {f"cluster_{i}": [] for i in range(self.n_clusters)}
        for session, label in zip(sessions, cluster_labels):
            clusters[f"cluster_{label}"].append(session.session_id)
        
        # Store cluster results
        await self._store_clusters(clusters)
        
        logger.info(f"Clustered {len(sessions)} sessions into {self.n_clusters} groups")
        return clusters
    
    async def _store_clusters(self, clusters: Dict[str, List[str]]):
        """Store clustering results in Redis"""
        pipe = self.redis_client.pipeline()
        
        for cluster_id, session_ids in clusters.items():
            pipe.delete(f"cluster:{cluster_id}")
            if session_ids:
                pipe.sadd(f"cluster:{cluster_id}", *session_ids)
            pipe.expire(f"cluster:{cluster_id}", 3600 * 24)  # 24 hour TTL
        
        await pipe.execute()

if __name__ == "__main__":
    async def main():
        clusterer = SessionClusterer()
        await clusterer.connect()
        clusters = await clusterer.cluster_sessions()
        print(f"Generated {len(clusters)} clusters")
    
    asyncio.run(main())