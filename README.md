# Sticky Scroll Extension

A Chrome extension that uses ML to predict user scroll intent and provide intelligent scroll persistence across page loads.

## Architecture

### Core Components
- **Extension**: Chrome extension with content scripts for scroll behavior detection
- **ML Pipeline**: Real-time scroll pattern analysis and intent prediction
- **Infrastructure**: Kubernetes-based microservices with observability

### Key Features
- Scroll position persistence with smart restore
- ML-based scroll intent prediction (reading/scanning/seeking)
- Real-time pattern analysis and anomaly detection
- Performance monitoring and adaptive thresholds

## Services

### ML Services
- `scroll-classifier.py`: Classifies scroll behaviors into patterns
- `pattern-classifier.py`: Advanced pattern recognition
- `anomaly-detector.py`: Detects unusual scroll behaviors
- `intent-predictor.py`: Predicts user scroll intent from behavior patterns

### Monitoring Stack
- Prometheus metrics collection
- Grafana dashboards for scroll analytics
- AlertManager for performance degradation

## Skills Demonstrated
- **ML/AI**: Real-time behavior classification, intent prediction, feature engineering
- **Infrastructure**: Kubernetes deployment, Terraform IaC, Redis caching
- **Backend**: Microservices architecture, async Python services
- **Database**: Redis for real-time data, metric storage
- **DevOps**: Container orchestration, monitoring stack
- **SRE**: Prometheus metrics, alerting, observability

## Quick Start

```bash
# Deploy infrastructure
cd infrastructure/terraform
terraform apply

# Deploy services
kubectl apply -f infrastructure/k8s/

# Load extension in Chrome
# Navigate to chrome://extensions/
# Enable Developer Mode
# Click "Load unpacked" and select this directory
```

## Metrics
- Scroll event processing latency
- Intent prediction accuracy
- Pattern classification metrics
- Performance impact on web pages

## Development

```bash
# Run ML services locally
python infrastructure/services/intent-predictor.py

# Run tests
npm test
```

Built with: Python, JavaScript, Kubernetes, Redis, Prometheus, Terraform