import os
from flask import Flask, request, jsonify
from recipe_service import parse_recipe 
from flask_cors import CORS
app = Flask(__name__)
CORS(app)  # Allow requests from your Node.js backend
@app.route('/recipe-parser', methods=['POST'])
@app.route('/recipe-parser', methods=['POST'])
def index():
    print("=== PARSER ENDPOINT HIT ===", flush=True)
    try:
        data = request.get_json()
        url = data.get("link")
        print(f"URL received: {url}", flush=True)
        
        if not url:
            return jsonify({"error": "No URL provided"}), 400
        
        print("About to call parse_recipe...", flush=True)
        result = parse_recipe(url)
        print(f"Parse successful!", flush=True)
        return result
        
    except Exception as e:
        print("=== ERROR ===", flush=True)
        print(f"Error: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200
port = int(os.environ.get("PORT", 5000))
app.run(host="0.0.0.0", port=port, debug=False)