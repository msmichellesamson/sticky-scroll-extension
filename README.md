# Sticky Scroll Extension

A browser extension that intelligently preserves scroll positions using ML-powered pattern recognition.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Browser Ext    │────│  Data Service   │────│  Pattern ML     │
│  (JavaScript)   │    │  (Python)       │    │  (Python)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                      ┌─────────────────┐
                      │  Redis Cache    │
                      │  (Pattern Data) │
                      └─────────────────┘
```

## Skills Demonstrated

- **AI/ML**: Scroll pattern classification, behavior prediction
- **Infrastructure**: Terraform GCP deployment, Kubernetes orchestration
- **Backend**: Python data service, Redis caching
- **DevOps**: Container deployment, monitoring setup
- **Database**: Redis for pattern caching
- **SRE**: Prometheus metrics, Grafana dashboards

## Components

### Browser Extension
- Content script with scroll tracking
- ML feature extraction
- Performance monitoring

### Infrastructure
- **Terraform**: GCP resources (GKE, Cloud Storage)
- **Kubernetes**: Pattern classifier service, Redis cache
- **Monitoring**: Prometheus + Grafana + AlertManager

### Data Pipeline
- Python pattern classifier service
- Redis for scroll position caching
- Telemetry collection and analysis

## Deployment

```bash
# Deploy infrastructure
cd infrastructure/terraform
terraform apply

# Deploy to Kubernetes
kubectl apply -f infrastructure/k8s/
```

## Monitoring

- **Metrics**: Extension performance, ML accuracy
- **Dashboards**: User behavior analysis
- **Alerts**: Pattern detection failures

## Development

```bash
# Install extension locally
chrome://extensions -> Load unpacked

# Run tests
npm test
```