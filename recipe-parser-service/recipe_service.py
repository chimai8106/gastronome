import json
from urllib.request import urlopen
from recipe_scrapers import scrape_html, scrape_me
from urllib.request import Request, urlopen

def parse_recipe(url):
    print("parsing")
    #Get url from request json
    request = Request(
    url,
    headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0 Safari/537.36"
    }
    )

    html = urlopen(request).read().decode("utf-8")
    scraper = scrape_me(url)
    #Extract recipe information
    res_lib = { "title": scraper.title(), 
               "instruction": scraper.instructions(),
               "ingredients": scraper.ingredients(), 
               "timePrepared": scraper.total_time(),
               "numServings": scraper.yields(),
               "image": scraper.image(),
               "authorName": scraper.author()
               }
    return json.dumps(res_lib)



