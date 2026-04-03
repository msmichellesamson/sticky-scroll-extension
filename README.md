# Sticky Scroll Extension

Browser extension that intelligently preserves scroll positions using ML-powered behavior analysis and cloud infrastructure.

## Features
- **Adaptive Scroll Persistence**: ML models predict optimal save points
- **Pattern Recognition**: Behavioral analysis for improved UX
- **Performance Monitoring**: Full observability stack
- **Anomaly Detection**: Real-time scroll behavior analysis

## Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Extension     │───▶│  Data Services  │───▶│   Redis Cache   │
│  (JavaScript)   │    │    (Python)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │    Monitoring Stack     │
                    │ Prometheus + Grafana    │
                    └─────────────────────────┘
```

## ML Services
- **Scroll Classifier**: Categorizes scroll patterns (fast, reading, scanning)
- **Pattern Classifier**: Identifies user behavior types
- **Intent Predictor**: Predicts when to save scroll positions
- **Anomaly Detector**: Detects unusual scroll behaviors

## Infrastructure
- **Kubernetes**: Service orchestration and scaling
- **Terraform**: Infrastructure as Code for GCP
- **Redis**: High-performance caching layer
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization dashboards

## Monitoring
- Application performance metrics
- ML model accuracy tracking
- Redis performance monitoring
- User behavior analytics
- SLI/SLO tracking with alerting

## Development
```bash
# Deploy infrastructure
cd infrastructure/terraform
terraform init && terraform apply

# Deploy services
kubectl apply -f infrastructure/k8s/

# Load extension in browser
# Chrome: chrome://extensions/ -> Load unpacked
```

## Tech Stack
- **Extension**: JavaScript (Chrome Extension API)
- **Backend**: Python (FastAPI, scikit-learn, Redis)
- **Infrastructure**: Terraform, Kubernetes, GCP
- **Monitoring**: Prometheus, Grafana, Alertmanager
- **Data**: Redis, structured logging