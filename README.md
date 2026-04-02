# Sticky Scroll Extension

An intelligent browser extension that learns user scroll patterns and provides adaptive scroll persistence with ML-powered behavior detection.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Browser Ext    │◄──►│   Data Services  │◄──►│  Infrastructure │
│                 │    │                  │    │                 │
│ • Content Script│    │ • Pattern Class. │    │ • Redis Cluster │
│ • ML Features   │    │ • Scroll Class.  │    │ • Prometheus    │
│ • Persistence   │    │ • Anomaly Detect │    │ • Grafana       │
│ • Analytics     │    │                  │    │ • Kubernetes    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Skills Demonstrated

**AI/ML + Data Engineering:**
- Real-time scroll pattern classification with scikit-learn
- Anomaly detection using Isolation Forest
- Feature extraction from user behavior streams
- ML model serving with Redis-backed inference

**Infrastructure + SRE:**
- Kubernetes deployment with Redis cluster
- Prometheus metrics and Grafana dashboards
- Terraform infrastructure as code
- Health checks and observability

**Backend + Database:**
- Python microservices with async Redis
- Real-time data pipeline architecture
- Time-series data storage and querying

## Services

### Browser Extension
- **Content Script**: Captures scroll events, calculates velocity/acceleration
- **ML Features**: Extracts behavioral patterns for classification
- **Persistence**: Saves/restores scroll positions intelligently
- **Analytics**: Real-time telemetry and performance monitoring

### Data Services
- **Pattern Classifier**: ML service for scroll behavior categorization
- **Scroll Classifier**: Predicts optimal scroll positions
- **Anomaly Detector**: Real-time detection of unusual scroll patterns

### Infrastructure
- **Redis**: Event streaming and feature store
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Real-time dashboards and visualization
- **Kubernetes**: Container orchestration and scaling

## Quick Start

```bash
# Deploy infrastructure
cd infrastructure/terraform
terraform init && terraform apply

# Start services
kubectl apply -f infrastructure/k8s/

# Load extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked" and select this directory
```

## Monitoring

- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Redis Metrics**: Available via Prometheus exporters

## Key Features

- **Adaptive Learning**: ML models learn individual user patterns
- **Real-time Classification**: Sub-100ms scroll behavior categorization
- **Anomaly Detection**: Identifies unusual scrolling patterns
- **Production Monitoring**: Full observability stack
- **Scalable Architecture**: Kubernetes-ready microservices

## Technical Highlights

- Isolation Forest anomaly detection with 0.1 contamination rate
- Redis Streams for real-time event processing
- Prometheus metrics with custom alerting rules
- Terraform modules for reproducible infrastructure
- Async Python services with proper error handling

## Performance

- < 1ms scroll event processing
- < 100ms ML inference latency
- Redis cluster handles 10k+ events/second
- Auto-scaling based on CPU/memory metrics

Built with: Python, JavaScript, Redis, Kubernetes, Terraform, Prometheus, Grafana