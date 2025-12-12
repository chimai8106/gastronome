import os
import sys

from dotenv import load_dotenv

load_dotenv()

from flask import Flask, request, jsonify
from recipe_service import parse_recipe 
from flask_cors import CORS
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(ROOT, "atomic-agents", "atomic-examples", "youtube-to-recipe"))
import youtube_to_recipe.main as youtube_service
import tiktok_service as tiktok

app = Flask(__name__)

# Configure CORS properly
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://gastronome-official.onrender.com",
            "http://localhost:5173",
            "http://localhost:5001"
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Accept", "User-Agent"]
    }
})


def is_youtube_url(url):
    domain = urlparse(url).netloc.lower()
    youtube_domains = {
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "youtu.be",
        "www.youtu.be",
        "youtube-nocookie.com",
    }
    return domain in youtube_domains

def is_tiktok_url(url):
    domain = urlparse(url).netloc.lower()
    tiktok_domains = {
        "tiktok.com",
        "www.tiktok.com",
        "m.tiktok.com",
        "vm.tiktok.com", 
        "vt.tiktok.com", 
    }
    return domain in tiktok_domains

@app.route('/recipe-parser', methods=['POST'])
def index():
    try:
        data = request.get_json()
        url = data.get("link")        
        if not url:
            return jsonify({"error": "No URL provided"}), 400
        if is_youtube_url(url):
            result = youtube_service.parse_youtube_url(url)
        else:
            if is_tiktok_url(url):
                result = tiktok.parse_tiktok_recipe(url)
            else:
                result = parse_recipe(url)
        return result
    except Exception as e:
        print(f"Error: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET', 'OPTIONS'])  
def health():
    return jsonify({'status': 'healthy'}), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000)) 
    app.run(host="0.0.0.0", port=port, debug=False)