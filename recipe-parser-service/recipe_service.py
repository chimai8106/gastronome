import json
import re
from urllib.request import Request, urlopen
from recipe_scrapers import scrape_html
from bs4 import BeautifulSoup

def extract_image_from_json_ld(data):
    """Extract image URL from JSON-LD data (handles various formats)"""
    image = data.get("image")
    
    if not image:
        return None
    
    # Image can be a string
    if isinstance(image, str):
        return image
    
    # Image can be a list
    if isinstance(image, list) and len(image) > 0:
        first_img = image[0]
        if isinstance(first_img, str):
            return first_img
        if isinstance(first_img, dict):
            return first_img.get("url") or first_img.get("contentUrl")
    
    # Image can be a dict
    if isinstance(image, dict):
        return image.get("url") or image.get("contentUrl")
    
    return None

def extract_instructions_from_json_ld(instructions_data):
    """Extract and format instructions from JSON-LD data"""
    if not instructions_data:
        return ""
    
    instructions = []
    
    # Handle list of instructions
    if isinstance(instructions_data, list):
        for step in instructions_data:
            if isinstance(step, dict):
                # Handle HowToStep format
                if step.get("@type") == "HowToStep":
                    text = step.get("text") or step.get("itemListElement", {}).get("text", "")
                    if text:
                        instructions.append(text.strip())
                # Handle HowToSection format
                elif step.get("@type") == "HowToSection":
                    section_steps = step.get("itemListElement", [])
                    for section_step in section_steps:
                        if isinstance(section_step, dict):
                            text = section_step.get("text", "")
                            if text:
                                instructions.append(text.strip())
                else:
                    # Generic dict with text
                    text = step.get("text", "")
                    if text:
                        instructions.append(text.strip())
            elif isinstance(step, str):
                instructions.append(step.strip())
    
    # Handle single string
    elif isinstance(instructions_data, str):
        instructions.append(instructions_data.strip())
    
    # Join with newlines for better formatting
    return "\n".join(instructions) if instructions else ""

def smart_fallback(html):
    """Fallback parser: finds JSON-LD script where @type contains 'Recipe'."""
    soup = BeautifulSoup(html, "html.parser")
    

    # Check all JSON-LD scripts
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string)
            
            # Sometimes JSON-LD is a list - check all items
            items_to_check = data if isinstance(data, list) else [data]
            
            for item in items_to_check:
                if not isinstance(item, dict):
                    continue
                
                type_field = item.get("@type", "")
                
                # Accept any type that contains 'Recipe'
                if "Recipe" in type_field:
                    
                    title = item.get("name") or item.get("headline")
                    ingredients = item.get("recipeIngredient") or []
                    
                    # Extract instructions with proper formatting
                    instructions_data = item.get("recipeInstructions") or []
                    instructions = extract_instructions_from_json_ld(instructions_data)
                    
                    # Extract image
                    image = extract_image_from_json_ld(item)
                    
                    # Extract author
                    author_data = item.get("author")
                    author = None
                    if isinstance(author_data, dict):
                        author = author_data.get("name")
                    elif isinstance(author_data, str):
                        author = author_data
                    
                    result = {
                        "title": title,
                        "ingredients": ingredients,
                        "instructions": instructions,
                        "timePrepared": item.get("totalTime"),
                        "numServings": item.get("recipeYield"),
                        "image": image,
                        "authorName": author
                    }
                    
                    return result
                    
        except Exception as e:
            print(f"JSON-LD parsing error: {e}", flush=True)
            continue


    # Meta tags as backup for image
    og_image = soup.find("meta", property="og:image")
    image = og_image.get("content") if og_image else None
    
    # Try to find largest image if no og:image
    if not image:
        all_imgs = soup.find_all("img")
        for img in all_imgs:
            src = img.get("src")
            if src and not any(x in src.lower() for x in ['icon', 'logo', 'avatar', 'author', 'profile']):
                image = src
                break

    # 3️⃣ Title
    meta_title = soup.find("meta", property="og:title")
    title = meta_title.get("content") if meta_title and meta_title.get("content") else None
    
    if not title:
        h1 = soup.find("h1")
        title = h1.get_text(strip=True) if h1 else "Recipe"

    # 4️⃣ Generic HTML fallback for ingredients and instructions
    all_lis = [li.get_text(strip=True) for li in soup.find_all("li") if li.get_text(strip=True)]
    # Filter out obvious navigation
    ingredients = [li for li in all_lis if len(li) > 3 and len(li) < 200][:20]
    
    # Try to find paragraphs that might be instructions
    all_paragraphs = [p.get_text(strip=True) for p in soup.find_all("p") if len(p.get_text(strip=True)) > 30]
    instructions = "\n".join(all_paragraphs[:10])

    return {
        "title": title,
        "ingredients": ingredients,
        "instructions": instructions,
        "timePrepared": None,
        "numServings": None,
        "image": image,
        "authorName": None
    }


def parse_recipe_simple(url, html):
    """Simple parser using only recipe-scrapers"""
    
    scraper = scrape_html(html=html, org_url=url)
    
    # Extract recipe information
    res_lib = {
        "title": scraper.title(),
        "instructions": scraper.instructions(),
        "ingredients": scraper.ingredients(),
        "timePrepared": scraper.total_time(),
        "numServings": scraper.yields(),
        "image": scraper.image(),
        "authorName": scraper.author()
    }
    
    # Validate that we got meaningful data
    if not res_lib["ingredients"] or len(res_lib["ingredients"]) < 2:
        raise ValueError("No valid ingredients found")
    
    if not res_lib["instructions"] or len(res_lib["instructions"].strip()) < 20:
        raise ValueError("No valid instructions found")
    
    return res_lib


def parse_recipe(url):
    """
    Fetch recipe from URL:
    1. Try recipe_scrapers first
    2. Fall back to JSON-LD extraction (works for most modern recipe sites)
    3. Final fallback to HTML scraping
    """
    
    try:
        # Fetch HTML with headers
        request = Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                              "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9"
            }
        )
        
        try:
            html = urlopen(request, timeout=10).read().decode("utf-8")
        except UnicodeDecodeError:
            html = urlopen(request, timeout=10).read().decode("latin-1")

        # 1️⃣ Try recipe_scrapers first
        try:
            result = parse_recipe_simple(url, html)
            return json.dumps(result, ensure_ascii=False)
            
        except Exception as e:
            print(f"recipe-scrapers failed: {e}", flush=True)
            
            # Try smart fallback (JSON-LD + HTML)
            result = smart_fallback(html)
            return json.dumps(result, ensure_ascii=False)

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise