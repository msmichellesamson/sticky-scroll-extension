# Sticky Scroll Extension

A browser extension that remembers scroll positions across page visits with production-grade monitoring and health checks.

## Features

- **Scroll Position Memory**: Automatically saves and restores scroll positions
- **Privacy-First**: All data stored locally, no external tracking
- **Health Monitoring**: Built-in health checks and error tracking
- **Production Metrics**: Prometheus-compatible monitoring
- **Cross-Browser**: Works on Chrome, Firefox, Edge

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Content Script │    │   Background    │    │   Health Monitor│
│   (scroll track) │◄──►│   (storage)     │◄──►│   (diagnostics) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Local Storage  │    │   Telemetry     │    │   Prometheus    │
│  (positions)    │    │   (metrics)     │    │   (alerts)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Tech Stack

- **Runtime**: JavaScript (Web Extensions API)
- **Storage**: Chrome Storage API + Local Storage
- **Monitoring**: Custom telemetry + Prometheus metrics
- **Health**: Built-in health monitoring with error tracking
- **Infrastructure**: Docker + Prometheus alerting

## Quick Start

1. **Load Extension**:
   ```bash
   # Chrome: Load unpacked extension
   # Firefox: about:debugging > Load Temporary Add-on
   ```

2. **Monitor Health**:
   ```bash
   # Check extension health in popup
   # Or via storage: chrome.storage.local.get(['extension_health'])
   ```

3. **Production Monitoring**:
   ```bash
   docker-compose up -d
   # Prometheus: http://localhost:9090
   # Alerts configured for error rates
   ```

## Health Monitoring

The extension includes comprehensive health monitoring:

- **Error Tracking**: Automatic error counting and reporting
- **Uptime Monitoring**: Tracks extension runtime
- **Health Status**: Boolean health indicator based on error thresholds
- **Storage Integration**: Health data accessible via Chrome Storage API

## Files

- `manifest.json` - Extension configuration
- `content.js` - Scroll position tracking
- `background.js` - Storage and lifecycle management
- `popup.js/html/css` - User interface
- `health.js` - Health monitoring and diagnostics
- `telemetry.js` - Metrics collection
- `infrastructure/` - Prometheus monitoring setup

## Development

```bash
# Test health monitoring
const health = await chrome.storage.local.get(['extension_health']);
console.log('Extension health:', health.extension_health);

# Monitor errors
window.addEventListener('error', (e) => console.log('Error tracked:', e));
```

## Production Deployment

The extension is designed for production use with:

- Comprehensive error handling
- Health monitoring and alerting
- Privacy-compliant data handling
- Cross-browser compatibility
- Infrastructure as code (Terraform ready)

## Skills Demonstrated

- **SRE**: Health monitoring, error tracking, uptime measurement
- **Backend**: Event-driven architecture, storage management
- **Infrastructure**: Prometheus integration, monitoring setup
- **DevOps**: Extension packaging, deployment automation

Extension monitors its own health and exposes metrics for production observability.