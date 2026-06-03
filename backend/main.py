import json
import os
import bcrypt

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename

from config import Config, validate_config
from pdf_processor import extract_availability_from_file
from roster_generator import generate_roster

app = Flask(__name__)
CORS(app)

for folder in (Config.UPLOAD_FOLDER, Config.DATA_FOLDER):
    os.makedirs(folder, exist_ok=True)

app.config['UPLOAD_FOLDER'] = Config.UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH

ALLOWED_EXTENSIONS = {'pdf', 'csv', 'json', 'txt', 'xls', 'xlsx', 'xlsm', 'xltx', 'xltm'}

users_db = {}

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    if email in users_db:
        return jsonify({'error': 'User already exists'}), 400
    hashed = bcrypt.hashpw(data['password'].encode(), bcrypt.gensalt())
    users_db[email] = {
        'email': email,
        'password': hashed,
        'first_name': data.get('firstName'),
        'last_name': data.get('lastName')
    }
    return jsonify({'email': email}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = users_db.get(data.get('email'))
    if not user or not bcrypt.checkpw(data['password'].encode(), user['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    return jsonify({'email': user['email'], 'first_name': user['first_name']}), 200

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_processed_data(filename, data):
    json_filename = f"{os.path.splitext(filename)[0]}.json"
    json_path = os.path.join(Config.DATA_FOLDER, json_filename)
    with open(json_path, 'w', encoding='utf-8') as json_file:
        json.dump(data, json_file, ensure_ascii=False, indent=2)
    return json_filename


def load_processed_data(filename):
    json_path = os.path.join(Config.DATA_FOLDER, secure_filename(filename))
    if not os.path.exists(json_path):
        return None
    with open(json_path, 'r', encoding='utf-8') as json_file:
        return json.load(json_file)


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Supported files: CSV, Excel, JSON, TXT, PDF'}), 400

    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        availability_data = extract_availability_from_file(filepath)
        if not availability_data:
            return jsonify({'error': 'No employee availability data found in this file'}), 400

        stored_file = save_processed_data(filename, availability_data)
        roster = generate_roster(availability_data)

        return jsonify({
            'status': 'success',
            'filename': filename,
            'stored_file': stored_file,
            'data': availability_data,
            'roster': roster
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/generate-roster', methods=['POST'])
def generate():
    try:
        body = request.get_json() or {}
        availability = body.get('availability') or body.get('data')

        if not availability and body.get('stored_file'):
            availability = load_processed_data(body['stored_file'])

        if not availability:
            return jsonify({'error': 'No availability data provided'}), 400

        roster = generate_roster(availability)
        if not roster:
            return jsonify({'error': 'Could not generate roster'}), 400

        return jsonify({
            'status': 'success',
            'roster': roster
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    validate_config()
    app.run(debug=Config.DEBUG, host='0.0.0.0', port=Config.API_PORT)