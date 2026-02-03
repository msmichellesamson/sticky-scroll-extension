# Sticky Scroll Extension

Browser extension that maintains scroll positions across page navigation and refreshes.

## Skills Demonstrated

- **DevOps**: Prometheus monitoring, alert rules, error tracking
- **Backend**: Circuit breaker pattern, resilient API integration
- **SRE**: Failure recovery, observability, reliability patterns

## Architecture

```
Content Script ← → Background Service ← → Analytics API
      ↓                    ↓              ↓
  DOM Events         Circuit Breaker   Monitoring
```

## Monitoring

- Circuit breaker prevents cascade failures
- Failed events stored locally for retry
- Prometheus metrics via `/infrastructure/prometheus.yml`
- Alert rules trigger on high failure rates

## Error Handling

- **Circuit Breaker**: 3 failures → 60s cooldown
- **Local Fallback**: Failed events stored in chrome.storage
- **Graceful Degradation**: Extension works without analytics

## Files

- `content.js` - DOM scroll position tracking
- `background.js` - Service worker, storage management  
- `telemetry.js` - Circuit breaker, analytics integration
- `infrastructure/` - Prometheus config, alert rules

## Installation

1. Load unpacked extension in Chrome
2. Deploy monitoring: `kubectl apply -f infrastructure/`
3. Extension automatically tracks scroll positions