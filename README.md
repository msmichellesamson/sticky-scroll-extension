# Sticky Scroll Extension

A browser extension that uses machine learning to detect scroll patterns and provide intelligent scroll position persistence.

## Architecture

### Core Components
- **Content Script**: Captures scroll behavior and viewport data
- **Background Service**: Coordinates persistence and ML inference  
- **Pattern Classifier**: ML service for scroll behavior analysis
- **Telemetry System**: Metrics collection and performance monitoring

### ML-Powered Features
- **Scroll Pattern Classification**: Detects reading vs browsing behavior
- **Adaptive Persistence**: Smart position saving based on user patterns
- **Performance Optimization**: Velocity-based scroll prediction

## Infrastructure

```bash
# Deploy ML classification service
kubectl apply -f infrastructure/k8s/

# Start monitoring stack
docker-compose -f infrastructure/docker-compose.yml up -d
```

### Services
- **Pattern Classifier**: Python/scikit-learn service (port 8080)
- **Redis Cache**: Pattern classification caching
- **Prometheus**: Metrics collection
- **Grafana**: Performance dashboards

## API Endpoints

### POST /classify
Classify scroll patterns from telemetry data:
```json
{
  "scroll_data": {
    "velocities": [120, 85, 200],
    "directions": [1, 1, -1],
    "timestamps": [1640000000, 1640000100, 1640000200]
  }
}
```

Response:
```json
{
  "pattern_type": "reading",
  "features": [1250.5, 2, 0.1, 3],
  "confidence": 0.85
}
```

## Development

```bash
# Install extension dependencies
npm install

# Run ML service locally
cd infrastructure/services
pip install -r requirements.txt
python pattern-classifier.py

# Load extension in Chrome
# Go to chrome://extensions/, enable Developer mode, Load unpacked
```

## Monitoring

- **Grafana Dashboard**: http://localhost:3000
- **Prometheus Metrics**: http://localhost:9090
- **Service Health**: http://localhost:8080/health

Metrics tracked:
- Scroll pattern classification accuracy
- API response times
- Extension performance impact
- User engagement patterns

## Tech Stack

- **Frontend**: Vanilla JavaScript (Chrome Extension)
- **ML Service**: Python, Flask, scikit-learn
- **Infrastructure**: Kubernetes, Terraform, Prometheus
- **Database**: Redis (caching)
- **Monitoring**: Grafana, Prometheus, AlertManager