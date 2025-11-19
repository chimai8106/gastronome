import os
from flask import Flask, request, jsonify
from recipe_service import parse_recipe 
from flask_cors import CORS
app = Flask(__name__)
CORS(app) 
@app.route('/recipe-parser', methods=['POST'])

def parse_recipe(url):
    print(f"=== PARSING URL: {url} ===", flush=True)
    
    try:
        recipe = parse_recipe(url, wild_mode=True)
        print(f"Recipe object created: {type(recipe)}", flush=True)
        
        # Test each field individually
        title = recipe.title()
        print(f"Title: {title}", flush=True)
        
        ingredients = recipe.ingredients()
        print(f"Ingredients type: {type(ingredients)}", flush=True)
        print(f"Ingredients length: {len(ingredients)}", flush=True)
        print(f"Ingredients content: {ingredients}", flush=True)
        
        instructions = recipe.instructions()
        print(f"Instructions length: {len(instructions)}", flush=True)
        
        result = {
            'title': title,
            'instruction': instructions,
            'ingredients': ingredients,
            'timePrepared': recipe.total_time(),
            'numServings': recipe.yields(),
            'image': recipe.image(),
            'authorName': recipe.author()
        }
        
        print(f"=== FINAL RESULT ===", flush=True)
        print(result, flush=True)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"ERROR in parse_recipe: {e}", flush=True)
        import traceback
        traceback.print_exc()
        raise


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000)) 
    app.run(host="0.0.0.0", port=port, debug=False)