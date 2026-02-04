# Sticky Scroll Extension

A Chrome extension that remembers and restores scroll positions across page reloads and navigation.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Content Script │    │  Background Script │    │     Popup UI    │
│                 │    │                  │    │                 │
│ • Scroll detection │  │ • Position storage │  │ • User controls │
│ • Auto-restore    │◄──┤ • Message routing │◄──┤ • Status display│
│ • Debounced saves │   │ • Tab management  │    │ • Settings      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Core Components

- **Content Script**: Captures scroll events, restores positions
- **Background Script**: Manages storage, handles cross-tab communication  
- **Popup Interface**: User controls and position monitoring
- **Storage Layer**: Chrome sync storage for persistence

## SRE & Observability

### Metrics Collection
```bash
# View extension metrics
chrome://extensions/?id=<extension-id>
```

### Health Monitoring
- Storage quota usage tracking
- Error rate monitoring via `analytics.js`
- Performance metrics in `telemetry.js`

### Infrastructure
```bash
# Deploy monitoring stack
cd infrastructure/
docker-compose up -d
```

## API Reference

See [API Documentation](docs/api.md) for complete message protocol and integration examples.

## Development

```bash
# Load extension in Chrome
1. Open chrome://extensions/
2. Enable Developer mode
3. Click "Load unpacked" and select project directory

# Monitor logs
chrome://extensions/ → Inspect views: background page
```

## Production Deployment

- Chrome Web Store submission ready
- Privacy policy compliant
- Prometheus monitoring included
- Error tracking enabled

## Technical Stack

- **Frontend**: Vanilla JavaScript (Chrome Extension APIs)
- **Storage**: Chrome Sync Storage
- **Monitoring**: Prometheus + Custom metrics
- **Infrastructure**: Docker Compose
- **Deployment**: Chrome Web Store