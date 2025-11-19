import json
from urllib.request import Request, urlopen
from recipe_scrapers import scrape_html
from flask import jsonify

def parse_recipe(url):
    print(f"Parsing recipe from: {url}", flush=True)
    
    try:
        #Fetch HTML with proper headers
        request = Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0 Safari/537.36"
            }
        )
        html = urlopen(request).read().decode("utf-8")
        print(f"HTML fetched successfully, length: {len(html)}", flush=True)
        
        scraper = scrape_html(html=html, org_url=url)
        print(f"Scraper created: {type(scraper)}", flush=True)
        
        #Extract recipe information
        ingredients = scraper.ingredients()
        print(f"Ingredients found: {len(ingredients)}", flush=True)
        
        res_lib = {
            "title": scraper.title(), 
            "instruction": scraper.instructions(),
            "ingredients": ingredients, 
            "timePrepared": scraper.total_time(),
            "numServings": scraper.yields(),
            "image": scraper.image(),
            "authorName": scraper.author()
        }
        
        print(f"Recipe parsed successfully: {res_lib['title']}", flush=True)
        return json.dumps(res_lib)
        
    except Exception as e:
        print(f"Error parsing recipe: {e}", flush=True)
        import traceback
        traceback.print_exc()
        raise