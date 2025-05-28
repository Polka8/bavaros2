
FROM python:3.10-slim


WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt


COPY . .
COPY ../.env /app/.env



EXPOSE 3000

CMD ["python", "run.py"]
