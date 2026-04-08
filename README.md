# Sticky Scroll Extension

A browser extension that uses ML to predict and maintain optimal scroll positions with intelligent behavior detection.

## Architecture

- **Frontend**: Browser extension (JavaScript)
- **Backend**: Python ML services on Kubernetes
- **Database**: PostgreSQL for model storage, Redis for caching
- **Infrastructure**: Terraform + GCP, Prometheus monitoring

## Skills Demonstrated

- **AI/ML**: Real-time scroll prediction, behavioral pattern analysis
- **Infrastructure**: Terraform, Kubernetes, cloud architecture
- **SRE**: Prometheus metrics, Grafana dashboards, alerting
- **Backend**: Microservices, distributed ML inference
- **Database**: PostgreSQL optimization, Redis caching
- **DevOps**: Container orchestration, monitoring

## Services

```
scroll-intent-predictor.py    # ML model for scroll behavior
velocity-predictor.py         # Velocity-based predictions
pattern-classifier.py         # User pattern analysis
anomalv-detector.py           # Anomaly detection service
```

## Monitoring

- **Grafana Dashboards**: ML model performance, Redis metrics, PostgreSQL storage
- **Prometheus**: Custom metrics, SLI/SLO tracking
- **Alerting**: Model drift, performance degradation

## Deployment

```bash
# Infrastructure
terraform -chdir=infrastructure/terraform apply

# Services
kubectl apply -f infrastructure/k8s/
```