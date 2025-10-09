# backend/app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# Step 1: Create the database object (we'll link it to Flask later)
db = SQLAlchemy()

def create_app():
    # Step 2: Create the Flask application
    app = Flask(__name__)

    # Step 3: Configure it (temporary setup)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dev.db'  # we’ll switch this to PostgreSQL soon
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.secret_key = 'dev-secret'  # used for sessions / JWT later

    # Step 4: Connect Flask <-> Database
    db.init_app(app)

    # Step 5: Import and register routes (we’ll write routes.py next)
    from .routes import main
    app.register_blueprint(main)

    # Step 6: Return the ready-to-use Flask app
    return app
