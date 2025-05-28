from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate # type: ignore
from flask_mail import Mail 
import os
from datetime import timedelta
from dotenv import load_dotenv
load_dotenv(dotenv_path="/app/.env")


db = SQLAlchemy()
jwt = JWTManager()
mail = Mail()

def create_app():
    app = Flask(__name__)
        # Aggiungi i metodi DELETE e OPTIONS alla configurazione CORS
    CORS(app, resources={r"/api/*": {
        "origins": "http://localhost:4200",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Authorization", "Content-Type"]
    }})    # Configurazione del database
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
        "DATABASE_URL", 
        "mysql+pymysql://root:password123@db/bavaros?charset=utf8mb4"
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 3600
    }
    
    # Configurazione JWT
    app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "super-secret-key")
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

        # Mail config
    app.config['MAIL_SERVER'] = os.getenv("MAIL_SERVER")
    mail_port = os.getenv("MAIL_PORT")
    print("DEBUG - MAIL_PORT:", mail_port)  # Rimuovi in produzione

    if mail_port is None:
        raise ValueError("MAIL_PORT non definito nel file .env")

    app.config['MAIL_PORT'] = int(mail_port)
    app.config['MAIL_USE_TLS'] = os.getenv("MAIL_USE_TLS") == "True"
    app.config['MAIL_USERNAME'] = os.getenv("MAIL_USERNAME")
    app.config['MAIL_PASSWORD'] = os.getenv("MAIL_PASSWORD")
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv("MAIL_DEFAULT_SENDER")

    # Inizializzazione estensioni
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    migrate = Migrate(app, db)

    with app.app_context():
        from .models import User, RuoloEnum
        db.create_all()
        
        # Creazione dell'admin se non esiste
        
        
        from .routes import init_routes
        init_routes(app)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=3000, debug=True)
