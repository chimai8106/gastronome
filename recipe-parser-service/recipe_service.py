import json
from urllib.request import Request, urlopen
from recipe_scrapers import scrape_html
from flask import jsonify

def parse_recipe(url):
    
    try:
        #Fetch HTML with proper headers
        request = Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0 Safari/537.36"
            }
        )
        html = urlopen(request).read().decode("utf-8")
        
        scraper = scrape_html(html=html, org_url=url)
        
        #Extract recipe information
        ingredients = scraper.ingredients()
        
        res_lib = {
            "title": scraper.title(), 
            "instruction": scraper.instructions(),
            "ingredients": ingredients, 
            "timePrepared": scraper.total_time(),
            "numServings": scraper.yields(),
            "image": scraper.image(),
            "authorName": scraper.author()
        }
        
        return json.dumps(res_lib)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise