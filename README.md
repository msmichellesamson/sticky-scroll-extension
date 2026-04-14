# Sticky Scroll Extension

Browser extension that uses ML to predict and restore optimal scroll positions across page visits.

## Architecture

### Core Components
- **Content Script**: DOM interaction and scroll capture
- **Background Service**: Event coordination and data persistence
- **ML Pipeline**: Pattern analysis and position prediction
- **Infrastructure**: Kubernetes-based model serving

### Error Handling
- Circuit breaker pattern for API resilience
- Exponential backoff retry logic for transient failures
- Comprehensive error logging with context

### ML Features
- Scroll velocity tracking and momentum prediction
- User behavior pattern classification
- Confidence scoring for position predictions
- Real-time model serving via Python microservices

### Infrastructure
- **Kubernetes**: Model serving and Redis clustering
- **Terraform**: GCP resource provisioning
- **Prometheus**: Metrics collection and alerting
- **Grafana**: ML model and infrastructure dashboards

### Tech Stack
- **Frontend**: Vanilla JavaScript (Chrome Extension API)
- **Backend**: Python microservices (FastAPI)
- **ML**: scikit-learn, pandas, numpy
- **Storage**: Redis Sentinel cluster, PostgreSQL
- **Infra**: GCP, Kubernetes, Terraform
- **Monitoring**: Prometheus, Grafana, AlertManager

## Quick Start

```bash
# Deploy infrastructure
cd infrastructure/terraform
terraform apply

# Deploy to Kubernetes
kubectl apply -f infrastructure/k8s/

# Load extension in Chrome
# 1. Navigate to chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked" and select this directory
```

## Production Features
- Adaptive confidence thresholds
- Circuit breaker protection
- Health monitoring and alerting
- Multi-cluster Redis Sentinel
- Zero-downtime model updates