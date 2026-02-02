# Sticky Scroll Extension

> Browser extension for enhanced sticky element behavior with production-grade monitoring and infrastructure

## Overview

A Chrome/Firefox extension that improves sticky scroll behavior on web pages with built-in performance monitoring, alerting, and observability infrastructure.

**Skills Showcased:** SRE + Backend + Infrastructure + Data Engineering

## Features

- Enhanced sticky element positioning and behavior
- Real-time performance metrics collection
- Prometheus-compatible metrics export
- Production observability stack
- Automated alerting for performance issues

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Content       │    │   Background    │    │   Metrics       │
│   Script        │───▶│   Service       │───▶│   Collector     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                  │
                                  ▼
                        ┌─────────────────┐
                        │   Prometheus    │
                        │   + Grafana     │
                        └─────────────────┘
```

## Metrics Collected

- `sticky_scroll_events_total` - Total scroll events processed
- `sticky_activations_total` - Sticky element activations
- `scroll_velocity_avg` - Average scroll velocity (px/ms)
- `performance_issues_total` - Performance problems detected

## Infrastructure

- **Monitoring**: Prometheus + Grafana stack
- **Alerting**: Custom alert rules for performance thresholds
- **Deployment**: Containerized with Docker
- **CI/CD**: Automated testing and deployment pipeline

## Installation

1. Load unpacked extension in Chrome/Firefox developer mode
2. Deploy monitoring stack: `docker-compose up -d`
3. Access metrics at `chrome-extension://[id]/metrics`

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build extension
npm run build
```

## Monitoring

View metrics in Prometheus: `http://localhost:9090`
Dashboards in Grafana: `http://localhost:3000`

## License

MIT