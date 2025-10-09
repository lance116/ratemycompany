import os


class Config:
	SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")
	ENV = os.environ.get("FLASK_ENV", "development")
	DEBUG = ENV == "development"


