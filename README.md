# Sticky Scroll Extension

Intelligent browser extension that uses ML to predict and enhance scroll behavior through infrastructure-backed analytics.

## Architecture

### Core Components
- **Browser Extension**: JavaScript-based extension with ML feature extraction
- **Infrastructure Services**: Python ML services for scroll pattern analysis
- **Data Pipeline**: Real-time scroll behavior processing and prediction
- **Monitoring**: Prometheus + Grafana observability stack

### ML Services
- `scroll-intent-predictor.py`: Predicts user scroll intentions
- `pattern-classifier.py`: Classifies scroll patterns and behaviors  
- `scroll-classifier.py`: Categorizes scroll types (reading, skimming, searching)
- `anomaly-detector.py`: Detects unusual scroll behaviors
- `velocity-predictor.py`: Predicts future scroll velocity and momentum
- `intent-predictor.py`: Advanced intent prediction with confidence scoring

### Infrastructure
- **Kubernetes**: Service orchestration and scaling
- **Terraform**: Infrastructure as Code for GCP deployment
- **Redis**: Real-time data caching and session storage
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and monitoring dashboards

## Key Features

### Extension Capabilities
- Real-time scroll behavior analysis
- Adaptive scroll position persistence
- ML-based scroll intent prediction
- Performance monitoring and telemetry
- Privacy-first data collection

### Backend Intelligence
- Velocity prediction with confidence scoring
- Pattern recognition and classification
- Anomaly detection for unusual behaviors
- Adaptive thresholding based on user patterns

## Deployment

```bash
# Deploy infrastructure
cd infrastructure/terraform
terraform init && terraform apply

# Deploy services to Kubernetes
kubectl apply -f infrastructure/k8s/

# Load browser extension
# Chrome: Load unpacked extension from project root
```

## Monitoring

- **Metrics**: Prometheus endpoints on all services
- **Dashboards**: Grafana dashboards for scroll analytics
- **Alerts**: Automated alerting for service health and anomalies
- **Health Checks**: Comprehensive service health monitoring

## Privacy

All scroll data is processed locally in the browser with anonymous telemetry sent to backend services. No personally identifiable information is collected or stored.

## License

MIT License - see LICENSE file for details.