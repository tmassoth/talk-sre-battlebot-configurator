FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Microsoft ODBC Driver 18 for SQL Server (required by pyodbc).
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl gnupg unixodbc unixodbc-dev \
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install -r requirements.txt gunicorn

COPY app.py db.py ./

# Run as a non-root user.
RUN useradd --create-home --uid 10001 appuser
USER appuser

EXPOSE 3001

# gunicorn imports app:app directly and binds all interfaces
# (app.py's __main__ block binds 127.0.0.1 for local dev only).
CMD ["gunicorn", "--bind", "0.0.0.0:3001", "--workers", "2", "app:app"]
