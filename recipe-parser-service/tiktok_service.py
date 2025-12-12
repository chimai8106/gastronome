"""
TikTok Recipe Parser
Downloads TikTok videos, transcribes them with Whisper, and extracts recipe information
"""

from openai import OpenAI
import json
import yt_dlp
import os
import tempfile
from typing import Optional

# Recipe extraction schema for OpenAI function calling
recipe_extraction_schema = {
    "name": "extract_recipe",
    "description": "Extract structured recipe information from cooking videos",
    "parameters": {
        "type": "object",
        "properties": {
            "recipe_overview": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "prep_time": {"type": "string"},
                    "cook_time": {"type": "string"},
                    "servings": {"type": "integer"},
                    "difficulty": {
                        "type": "string",
                        "enum": ["Easy", "Intermediate", "Advanced"]
                    },
                    "cuisine_type": {"type": "string"},
                    "chef": {"type": "string"}
                },
                "required": ["title", "servings"]
            },
            "ingredients": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "item": {"type": "string"},
                        "amount": {"type": "string"},
                        "unit": {"type": "string"},
                        "notes": {"type": "string"}
                    },
                    "required": ["item", "amount"]
                }
            },
            "instructions": {
                "type": "array",
                "items": {"type": "string"}
            },
            "equipment": {
                "type": "array",
                "items": {"type": "string"}
            }
        },
        "required": ["recipe_overview", "ingredients", "instructions"]
    }
}


def download_tiktok_video(tiktok_url: str) -> str:
    """
    Download TikTok video using yt-dlp
    
    Args:
        tiktok_url: URL of the TikTok video
        
    Returns:
        str: Path to the downloaded video file
        
    Raises:
        Exception: If download fails
    """
    try:
        # Create a temporary file for the video
        temp_dir = tempfile.gettempdir()
        output_template = os.path.join(temp_dir, '%(id)s.%(ext)s')
        
        ydl_opts = {
            'format': 'best',
            'outtmpl': output_template,
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(tiktok_url, download=True)
            video_path = ydl.prepare_filename(info)
            
        return video_path
        
    except Exception as e:
        raise Exception(f"Failed to download TikTok video: {str(e)}")


def transcribe_video_with_whisper(video_path: str) -> str:
    """
    Transcribe video audio using OpenAI Whisper
    """
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        with open(video_path, 'rb') as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
        
        return transcript
        
    except Exception as e:
        raise Exception(f"Failed to transcribe video: {str(e)}")


def extract_recipe_from_transcript(transcript: str) -> dict:
    """
    Extract recipe information from transcript using GPT-4
    
    Args:
        transcript: Video transcript text
        
    Returns:
        dict: Raw recipe data from OpenAI
        
    Raises:
        Exception: If extraction fails
    """
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        
        response = client.chat.completions.create(
            model="gpt-4o-2024-08-06",
            messages=[
                {
                    "role": "system",
                    "content": """You are a professional chef that extracts recipe information from cooking video transcripts.
                    Analyze the transcript and provide detailed ingredient lists and cooking instructions.
                    Focus on precise measurements and important preparation notes.
                    If the video doesn't contain a recipe, still try to extract any cooking-related information."""
                },
                {
                    "role": "user",
                    "content": f"Please extract the recipe information from this video transcript:\n\n{transcript}"
                }
            ],
            tools=[{
                "type": "function",
                "function": recipe_extraction_schema
            }],
            tool_choice={"type": "function", "function": {"name": "extract_recipe"}}
        )
        
        tool_call = response.choices[0].message.tool_calls[0]
        recipe_data = json.loads(tool_call.function.arguments)
        
        return recipe_data
        
    except Exception as e:
        raise Exception(f"Failed to extract recipe: {str(e)}")


def format_recipe_for_schema(recipe_data: dict) -> dict:
    """
    Convert OpenAI response to Flask app schema format
    
    Args:
        recipe_data: Raw data from OpenAI function call
        
    Returns:
        dict: Formatted recipe matching Flask schema
    """
    overview = recipe_data.get("recipe_overview", {})
    ingredients_raw = recipe_data.get("ingredients", [])
    instructions_raw = recipe_data.get("instructions", [])
    
    # Format ingredients as plain strings
    ingredients = []
    for ing in ingredients_raw:
        item = ing.get("item", "")
        amount = ing.get("amount", "")
        unit = ing.get("unit", "")
        notes = ing.get("notes", "")
        
        # Build ingredient string
        ing_str = f"{amount} {unit} {item}".strip()
        if notes:
            ing_str += f" ({notes})"
        ingredients.append(ing_str)
    
    # Format instructions as plain text separated by newlines
    instructions_text = "\n".join(instructions_raw)
    
    # Calculate total time
    prep_time = overview.get("prep_time", "0")
    cook_time = overview.get("cook_time", "0")
    time_prepared = parse_time_to_minutes(prep_time, cook_time)
    
    # Build the formatted response matching the standard format
    formatted = {
        "title": overview.get('title', 'Recipe from TikTok'),
        "instructions": instructions_text,
        "ingredients": ingredients,
        "timePrepared": time_prepared,
        "numServings": overview.get('servings', None),
        "image": None, 
        "authorName": overview.get('chef', None)
    }
    
    return formatted


def parse_time_to_minutes(prep_time: str, cook_time: str) -> int:
    """
    Parse time strings (e.g., "30 minutes", "1 hour") to total minutes
    
    Args:
        prep_time: Preparation time string
        cook_time: Cooking time string
        
    Returns:
        int: Total time in minutes
    """
    def extract_minutes(time_str: str) -> int:
        if not time_str:
            return 0
        
        time_str = time_str.lower()
        total = 0
        
        # Extract hours
        if "hour" in time_str:
            try:
                hours = int(''.join(filter(str.isdigit, time_str.split("hour")[0])))
                total += hours * 60
            except (ValueError, IndexError):
                pass
        
        # Extract minutes
        if "min" in time_str:
            try:
                # Get the last number before "min"
                parts = time_str.split("min")[0].split()
                if parts:
                    minutes = int(''.join(filter(str.isdigit, parts[-1])))
                    total += minutes
            except (ValueError, IndexError):
                pass
        
        return total
    
    return extract_minutes(prep_time) + extract_minutes(cook_time)


def parse_tiktok_recipe(tiktok_url: str) -> dict:
    """
    Main function: Download TikTok video, transcribe, and extract recipe
    
    Args:
        tiktok_url: URL of the TikTok video
        
    Returns:
        dict: Formatted recipe data
        
    Raises:
        Exception: If any step fails
    """
    video_path = None
    
    try:
        
        # Step 1: Download video
        video_path = download_tiktok_video(tiktok_url)
        
        # Step 2: Transcribe with Whisper
        transcript = transcribe_video_with_whisper(video_path)
        
        # Step 3: Extract recipe with GPT-4
        recipe_data = extract_recipe_from_transcript(transcript)
        
        # Step 4: Format to schema
        formatted_recipe = format_recipe_for_schema(recipe_data)
        
        return formatted_recipe
        
    except Exception as e:
        raise
        
    finally:
        # Clean up: Delete downloaded video
        if video_path and os.path.exists(video_path):
            try:
                os.remove(video_path)
            except Exception as e:
                print(f"Warning: Could not delete video file: {e}", flush=True)


