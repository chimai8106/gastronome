import os
from flask import Flask, request, jsonify
from recipe_service import parse_recipe 
from flask_cors import CORS
app = Flask(__name__)
CORS(app)  # Allow requests from your Node.js backend
@app.route('/recipe-parser', methods=['POST'])
def index():
    print("parsing")

    try:
        data = request.get_json()
        url = data.get("link")
        print("URL received:", url)
        if not url:
            return jsonify({"error": "No URL provided"}), 400
            
        return parse_recipe(url)
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200
port = int(os.environ.get("PORT", 5000))
app.run(host="0.0.0.0", port=port, debug=False)