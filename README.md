# Sticky Scroll Extension

Browser extension for intelligent scroll position management with SRE-grade monitoring.

## Features

### Core Functionality
- **Scroll Persistence**: Maintains scroll positions across page navigation
- **Velocity Tracking**: Monitors scroll speed and patterns
- **Performance Monitoring**: Tracks extension performance metrics
- **Health Checks**: Built-in health monitoring system

### SRE & Observability
- **Prometheus Integration**: Custom metrics collection
- **Alerting**: Automated alerts for performance issues
- **Error Tracking**: Comprehensive error handling and reporting
- **Telemetry**: User interaction analytics

## Architecture

```
Content Script ←→ Background Service ←→ Storage
      ↓               ↓                ↓
  Performance    Health Monitor    Persistence
   Tracker         System           Layer
      ↓               ↓                ↓
   Metrics      Prometheus        Local Storage
 Collection       Export           (Chrome)
```

## Technical Stack

- **Runtime**: Chrome Extension Manifest V3
- **Language**: JavaScript (ES6+)
- **Storage**: Chrome Storage API
- **Monitoring**: Prometheus + Alertmanager
- **Testing**: Jest

## Infrastructure

- `infrastructure/prometheus.yml` - Metrics collection config
- `infrastructure/alertmanager.yml` - Alert routing
- `infrastructure/alert_rules.yml` - Performance thresholds

## Files Structure

### Core Extension
- `manifest.json` - Extension configuration
- `content.js` - Page interaction logic
- `background.js` - Service worker
- `popup.js/html/css` - Extension UI

### Monitoring & SRE
- `performance.js` - Performance tracking
- `health.js` - Health check system
- `metrics.js` - Metrics collection
- `telemetry.js` - Usage analytics
- `error-handler.js` - Error management

### Features
- `scroll-persistence.js` - Scroll position management
- `velocity-tracker.js` - Scroll behavior analysis

### Infrastructure
- `infrastructure/` - Monitoring configuration
- `tests/` - Test suites

## Installation

1. Clone repository
2. Load as unpacked extension in Chrome
3. Configure Prometheus endpoint (optional)

## Development

```bash
# Run tests
npm test

# Monitor metrics
docker-compose up prometheus
```

## Metrics

- `scroll_position_saves_total` - Position save operations
- `scroll_velocity_avg` - Average scroll speed
- `extension_errors_total` - Error count
- `performance_timing_ms` - Operation timings

## Privacy

See `privacy-policy.html` for data handling details.

## License

MIT License - see LICENSE file.