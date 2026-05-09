from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)

# Allows React (port 3000) to talk to Flask (port 5001)
CORS(app, resources={r"/*": {"origins": "*"}})

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/upload', methods=['POST', 'OPTIONS'])
def upload_file():
    # Handle the browser's pre-flight check
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200

    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if file and file.filename.endswith('.pdf'):
        # In a real app, use werkzeug.utils.secure_filename
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(file_path)
        return jsonify({"message": f"Successfully uploaded {file.filename}!"}), 200
    else:
        return jsonify({"error": "Only PDF files are allowed"}), 400

if __name__ == '__main__':
    # Using Port 5001 to avoid Mac AirPlay conflict on Port 5000
    app.run(host='0.0.0.0', port=5001, debug=True)