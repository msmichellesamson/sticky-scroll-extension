# Sticky Scroll Extension

Browser extension that provides intelligent scroll position memory and predictive scrolling using ML-powered momentum analysis.

## Architecture

### Core Components
- **Content Script**: Tracks scroll behavior and applies intelligent positioning
- **ML Services**: Python-based prediction services for scroll momentum and intent
- **Infrastructure**: Kubernetes deployment with Redis caching and PostgreSQL storage

### Key Features
- **Momentum Prediction**: Physics-based scroll position forecasting
- **Pattern Recognition**: ML clustering of scroll behaviors
- **Adaptive Thresholds**: Dynamic confidence scoring
- **Circuit Breaker**: Reliability patterns for external services

## ML Services

### Recently Added
- `momentum-calculator.py` - Calculates scroll momentum and predicts future positions using velocity and acceleration data

### Existing Services
- `velocity-predictor.py` - Predicts scroll velocity patterns
- `scroll-intent-predictor.py` - Classifies user scroll intentions
- `pattern-clusterer.py` - Groups similar scroll behaviors
- `anomaly-detector.py` - Detects unusual scroll patterns

## Infrastructure

**Technologies**: Kubernetes, Terraform, Redis Sentinel, PostgreSQL, Prometheus
**Observability**: Grafana dashboards, Prometheus metrics, structured logging
**Reliability**: Circuit breakers, health checks, graceful degradation

## Deployment

```bash
# Deploy infrastructure
cd infrastructure/terraform
terraform apply

# Deploy services
kubectl apply -f k8s/
```

## Skills Demonstrated
- **AI/ML**: Momentum prediction, pattern clustering, anomaly detection
- **Infrastructure**: Kubernetes orchestration, Terraform IaC
- **Backend**: Microservices architecture, Redis caching
- **Data Engineering**: Real-time scroll event processing
- **SRE**: Circuit breakers, monitoring, alerting
- **DevOps**: Container orchestration, GitOps deployment

## Development

```bash
# Run tests
npm test

# Start local ML services
docker-compose up -d
```