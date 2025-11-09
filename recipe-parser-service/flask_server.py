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
        
        if not url:
            return jsonify({"error": "No URL provided"}), 400
            
        return parse_recipe(url)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)