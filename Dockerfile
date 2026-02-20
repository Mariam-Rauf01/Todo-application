FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code (excluding .dockerignore files)
COPY . .

# Remove any __pycache__ directories that might have been copied
RUN find /app -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
RUN find /app -type f -name "*.pyc" -delete 2>/dev/null || true

EXPOSE 7860

# Set Python to not write bytecode
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]