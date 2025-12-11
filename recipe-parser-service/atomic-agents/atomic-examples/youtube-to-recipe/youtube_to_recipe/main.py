import os
import json
from dotenv import load_dotenv
from rich.console import Console


from youtube_to_recipe.tools.youtube_transcript_scraper import (
    YouTubeTranscriptTool,
    YouTubeTranscriptToolConfig,
    YouTubeTranscriptToolInputSchema,
)

from youtube_to_recipe.agent import YouTubeRecipeExtractionInputSchema, youtube_recipe_extraction_agent, transcript_provider

load_dotenv()

def parse_youtube_url(url):
    """
    Extract recipe from YouTube video and format it to match the standard recipe format.
    """
    # Initialize a Rich Console for pretty console outputs
    console = Console()

    # Initialize the YouTubeTranscriptTool
    transcript_tool = YouTubeTranscriptTool(config=YouTubeTranscriptToolConfig(api_key=os.getenv("YOUTUBE_API_KEY")))

    # Remove the infinite loop and perform a one-time transcript extraction
    video_url = url

    transcript_input = YouTubeTranscriptToolInputSchema(video_url=video_url, language="en")
    try:
        transcript_output = transcript_tool.run(transcript_input)
        #console.print(f"[bold green]Transcript:[/bold green] {transcript_output.transcript}")
        #console.print(f"[bold green]Duration:[/bold green] {transcript_output.duration} seconds")

        # Update transcript_provider with the scraped transcript data
        transcript_provider.transcript = transcript_output.transcript
        transcript_provider.duration = transcript_output.duration
        transcript_provider.metadata = transcript_output.metadata

        # Run the transcript through the agent
        transcript_input_schema = YouTubeRecipeExtractionInputSchema(video_url=video_url)
        agent_response = youtube_recipe_extraction_agent.run(transcript_input_schema)

        # Print the output schema in a formatted way
        #console.print("[bold blue]Agent Output Schema:[/bold blue]")
        #console.print(agent_response)
        
        # Format the response to match the standard recipe format
        formatted_response = format_youtube_recipe(agent_response)
        
        return json.dumps(formatted_response, ensure_ascii=False)
        
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {str(e)}")
        raise


def format_youtube_recipe(agent_response):
    """
    Convert YouTube recipe extraction output to match the standard recipe format.
    """
    # Format ingredients list
    ingredients = []
    if hasattr(agent_response, 'ingredients'):
        for ing in agent_response.ingredients:
            # Format: "quantity unit item" or just "item" if no quantity
            if hasattr(ing, 'quantity') and ing.quantity:
                ingredient_str = f"{ing.quantity}"
                if hasattr(ing, 'unit') and ing.unit:
                    ingredient_str += f" {ing.unit}"
                ingredient_str += f" {ing.item}"
            else:
                ingredient_str = ing.item if hasattr(ing, 'item') else str(ing)
            ingredients.append(ingredient_str)
    
    # Format instructions from steps
    instructions = []
    if hasattr(agent_response, 'steps'):
        for step in agent_response.steps:
            if hasattr(step, 'instruction'):
                instructions.append(step.instruction)
            else:
                instructions.append(str(step))
    
    instructions_text = "\n".join(instructions) if instructions else ""
    
    # Format time (prep_time or cook_time)
    time_prepared = None
    if hasattr(agent_response, 'prep_time') and agent_response.prep_time:
        time_prepared = agent_response.prep_time
    elif hasattr(agent_response, 'cook_time') and agent_response.cook_time:
        time_prepared = agent_response.cook_time
    
    # Build the formatted response matching the standard format
    formatted = {
        "title": getattr(agent_response, 'recipe_name', 'Recipe from YouTube'),
        "instructions": instructions_text,
        "ingredients": ingredients,
        "timePrepared": time_prepared,
        "numServings": getattr(agent_response, 'servings', None),
        "image": None,  # YouTube videos don't have recipe images in the same way
        "authorName": getattr(agent_response, 'chef', None)
    }
    
    return formatted