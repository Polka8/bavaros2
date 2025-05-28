FROM node:20


# Imposta la directory di lavoro
WORKDIR /app

# Copia i file di configurazione e installa le dipendenze
COPY package.json package-lock.json ./
RUN npm install


RUN npm install -g @angular/cli


COPY . .


EXPOSE 4200

# Avvia il server Angular, forzando l'ascolto su 0.0.0.0 per l'accesso esterno
CMD ["ng", "serve", "--host", "0.0.0.0"]
