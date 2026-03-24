# Sticky Scroll Extension

A browser extension that maintains scroll position when navigating between pages with comprehensive monitoring and alerting.

## Architecture

### Components
- **Content Script**: Manages scroll position persistence across page loads
- **Background Service**: Handles extension lifecycle and cross-tab communication
- **Popup Interface**: User settings and status dashboard
- **Telemetry System**: Performance metrics and error tracking

### Infrastructure
- **Prometheus**: Metrics collection and storage
- **Alertmanager**: Alert routing and escalation
- **Health Monitoring**: Real-time extension status tracking

## Monitoring

### Metrics Collected
- Scroll position save/restore success rates
- Page load performance impact
- Error rates by browser and page type
- User engagement and feature adoption

### Alerting
- **Critical**: Extension crashes, high error rates (>5%)
- **Warning**: Performance degradation, unusual usage patterns
- **Escalation**: Critical alerts escalate to on-call, warnings to team email

### Alert Channels
- Email notifications for all severity levels
- Slack integration for critical alerts
- Webhook endpoints for custom integrations

## Quick Start

```bash
# Install dependencies
npm install

# Build extension
npm run build

# Start monitoring stack
docker-compose -f infrastructure/docker-compose.yml up -d

# Run tests
npm test
```

## Configuration

- Prometheus scrapes metrics on `:9090`
- Alertmanager routes alerts via `:9093`
- Health endpoint available at `/health`

## Development

- JavaScript ES6+ with Web Extensions API
- Chrome and Firefox compatible
- Production monitoring ready
- Automated testing pipeline

Built for reliability and observability in production browser extension deployments.