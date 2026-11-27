FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app/vision
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY ballr_vision.py server.py ./
COPY models ./models

ENV PORT=8787
EXPOSE 8787

CMD ["python", "server.py"]
