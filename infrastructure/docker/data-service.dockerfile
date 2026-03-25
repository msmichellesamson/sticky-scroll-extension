FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/
COPY config/ ./config/

EXPOSE 8080

CMD ["python", "-m", "src.api.main"]

# Health check for pattern API
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

ENV PYTHONPATH=/app
ENV LOG_LEVEL=INFO
ENV POSTGRES_URL=postgresql://user:pass@postgres:5432/scrolldb