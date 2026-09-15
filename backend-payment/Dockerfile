FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt ./
RUN pip install -r requirements.txt gunicorn

COPY app.py db.py ./

# Run as a non-root user.
RUN useradd --create-home --uid 10001 appuser
USER appuser

EXPOSE 3002

# gunicorn imports app:app directly and binds all interfaces
# (app.py's __main__ block binds 127.0.0.1 for local dev only).
CMD ["gunicorn", "--bind", "0.0.0.0:3002", "--workers", "2", "app:app"]
