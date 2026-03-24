# Sticky Scroll Extension

Browser extension that maintains scroll position context across page reloads with performance monitoring and reliability features.

## Architecture

- **Content Scripts**: Core scroll position tracking with velocity analysis
- **Background Service**: State persistence and cross-tab synchronization
- **Telemetry Pipeline**: Performance metrics collection and monitoring
- **Infrastructure**: Prometheus monitoring with alerting rules

## Features

- Automatic scroll position restoration
- Real-time velocity tracking for scroll behavior analysis
- Performance monitoring with custom metrics
- Error tracking and health monitoring
- Chrome extension store ready

## Technical Stack

- JavaScript (ES6+)
- Chrome Extension APIs
- Prometheus metrics
- Browser performance APIs

## Installation

1. Load unpacked extension in Chrome developer mode
2. Grant necessary permissions
3. Optional: Deploy monitoring stack with `infrastructure/`

## Monitoring

- Health checks via `health.js`
- Custom metrics in `metrics.js`
- Prometheus configuration in `infrastructure/`
- Performance tracking in `performance.js`

## Files

- `content.js` - Main scroll tracking logic
- `velocity-tracker.js` - Scroll velocity analysis
- `background.js` - Service worker for persistence
- `telemetry.js` - Metrics collection
- `infrastructure/` - Monitoring and alerting setup