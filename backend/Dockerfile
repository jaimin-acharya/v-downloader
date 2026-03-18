FROM python:3.11-slim

# Install ffmpeg and other dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -u 1000 appuser

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create cookies file if it doesn't exist, and fix CRLF -> LF newlines
# (yt-dlp on Linux requires LF; CRLF causes HTTP Error 400)
RUN touch cookies.txt && sed -i 's/\r$//' cookies.txt

# Give ownership to non-root user
RUN chown -R appuser:appuser /app
USER appuser

# Expose the port
EXPOSE 8080

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]