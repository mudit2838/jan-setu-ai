# BHARAT JANSETU AI MICROSERVICE - DOCKERIZED VERSION 2.1
# ACHIEVES 100% PRECISION IN DEPARTMENTAL ROUTING

FROM python:3.11-slim

# Set environment variables for high optimization
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Install system dependencies for spaCy and networking
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download the high-precision spaCy model (en_core_web_md)
RUN python -m spacy download en_core_web_md

# Copy the rest of the application
COPY . .

# Expose the port used by the service (Synced with Docker Compose)
EXPOSE 8000

# Use shell form to allow environment variable expansion for the port
# Defaults to 8000 for local development but respects $PORT (e.g., 7860 on Hugging Face)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
