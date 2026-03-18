FROM python:3.11-slim

# Install ffmpeg, curl, and Node.js (needed for PO token generation)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -u 1000 appuser

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install the PO (Proof of Origin) token provider plugin for yt-dlp.
# This generates tokens that make requests appear to come from a real browser,
# bypassing YouTube's "Sign in to confirm you're not a bot" on datacenter IPs.
RUN pip install --no-cache-dir bgutil-ytdlp-pot-provider

# Copy the rest of the application
COPY . .

# Create cookies file if it doesn't exist, and fix CRLF -> LF newlines
# (yt-dlp on Linux requires LF; CRLF causes HTTP Error 400)
RUN touch cookies.txt && sed -i 's/\r$//' cookies.txt

# Give ownership to non-root user (including yt-dlp plugin dirs)
RUN mkdir -p /home/appuser/.config/yt-dlp && \
    chown -R appuser:appuser /app /home/appuser

USER appuser

# Expose the port
EXPOSE 8080

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]