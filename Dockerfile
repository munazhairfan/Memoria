# Use an official Python slim runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
# - build-essential: required for compiling some Python packages if prebuilt wheels are not available
# - libgomp1: CRITICAL for FastEmbed / ONNX Runtime to avoid "libgomp.so.1" missing errors
# - curl: useful for running container health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Copy the requirements file into the working directory
COPY requirements.txt /app/

# Install Python dependencies
# Using --no-cache-dir to keep the image size small
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend directory structure into the container
COPY backend/ /app/backend/

# Create persistent storage directories for Cognee inside the container
# and ensure they are writable
RUN mkdir -p /app/backend/cognee_system /app/backend/.cognee_data

# Expose the port FastAPI runs on
EXPOSE ${PORT}

# Run the FastAPI server using uvicorn
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]
