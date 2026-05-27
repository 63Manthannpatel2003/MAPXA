import os
from dotenv import load_dotenv

load_dotenv()


def get_bool(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.lower() in {'1', 'true', 'yes', 'on'}


class Config:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = get_bool('FLASK_DEBUG', True)
    API_PORT = int(os.getenv('API_PORT', 5000))
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY') or os.getenv('GEMINI_API_KEY')
    GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    DATA_FOLDER = os.path.join(BASE_DIR, 'data')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024


def validate_config():
    return True
