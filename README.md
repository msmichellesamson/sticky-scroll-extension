# Sticky Scroll Extension

A browser extension that maintains scroll position when navigating between pages, with built-in telemetry for usage analytics.

## Features

- **Scroll Position Memory**: Automatically saves and restores scroll positions
- **Cross-tab Sync**: Scroll positions sync across browser tabs
- **Usage Telemetry**: Collects anonymous usage data for analytics
- **Privacy-focused**: Only tracks domain-level data, no personal information

## Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Content       │───▶│   Telemetry  │───▶│   Backend API   │
│   Script        │    │   Collector  │    │   (localhost)   │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │                                           │
         ▼                                           ▼
┌─────────────────┐                        ┌─────────────────┐
│   Local         │                        │   Analytics     │
│   Storage       │                        │   Database      │
└─────────────────┘                        └─────────────────┘
```

## Tech Stack

- **Frontend**: Vanilla JavaScript (content scripts, popup)
- **Storage**: Chrome Extension Local Storage API
- **Telemetry**: RESTful API integration
- **Privacy**: UUID-based client identification

## Installation

1. Clone repository
2. Load unpacked extension in Chrome
3. Optional: Set up telemetry backend (see Backend Setup)

## Backend Setup

Telemetry data is sent to `http://localhost:3001/api/telemetry`. 

Next steps:
- [ ] Python FastAPI backend for telemetry collection
- [ ] PostgreSQL for analytics storage
- [ ] Prometheus metrics export
- [ ] Grafana dashboards for usage insights

## Privacy

- Only domain names are collected (no full URLs)
- No personal data or page content
- Client ID is randomly generated UUID
- Data collection can be disabled in extension settings

## Development

```bash
# Test telemetry collector
node -e "const {TelemetryCollector} = require('./telemetry.js'); console.log('OK');"
```

## Files

- `manifest.json` - Extension configuration
- `content.js` - Main scroll position logic
- `telemetry.js` - Usage analytics collection
- `popup.html/js/css` - Extension settings UI

This extension serves as a foundation for building scalable browser extension analytics infrastructure.