# Sticky Scroll Extension

Intelligent browser extension that preserves scroll positions using ML-based pattern recognition and infrastructure monitoring.

## Features

- **Smart Scroll Persistence**: ML-powered scroll position restoration
- **Velocity Tracking**: Real-time scroll velocity analysis
- **Pattern Recognition**: Adaptive scrolling behavior detection
- **Production Monitoring**: Full observability with Prometheus/Grafana
- **Infrastructure as Code**: Terraform + Kubernetes deployment
- **Performance Analytics**: Extension health and usage metrics

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Browser Ext   │────│   Data Service   │────│   Monitoring    │
│  - Content JS   │    │  - Go Backend    │    │  - Prometheus   │
│  - Background   │    │  - PostgreSQL    │    │  - Grafana      │
│  - ML Features  │    │  - Redis Cache   │    │  - AlertManager │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Skills Demonstrated

- **AI/ML**: Pattern recognition, adaptive thresholds, feature extraction
- **Backend**: Go microservice with gRPC, REST APIs
- **Database**: PostgreSQL for analytics, Redis for caching
- **Infrastructure**: Terraform, Kubernetes, Docker
- **SRE**: Prometheus metrics, Grafana dashboards, alerting
- **DevOps**: Container deployment, monitoring pipeline

## Quick Start

```bash
# Deploy infrastructure
cd infrastructure/terraform
terraform apply

# Build extension
npm run build

# Load in Chrome
chrome://extensions/ → Load unpacked
```

## API Documentation

See [API Documentation](docs/api.md) for detailed browser extension APIs.

## Monitoring

- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090
- Health endpoint: http://localhost:8080/health

## Development

```bash
# Run tests
npm test

# Build for production
npm run build:prod

# Deploy monitoring
kubectl apply -f infrastructure/k8s/
```

## License

MIT