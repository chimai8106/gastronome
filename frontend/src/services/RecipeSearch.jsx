import React, { useState, useEffect } from "react";
import { searchRecipeByIngredients, addRecipe, addRecipeToCollection, removeRecipeFromCollection } from "./RecipeServices";
import { getMyRecipeCollection, addRecipeCollection } from "./RecipeCollectionServices";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";
import { useAddToCollection } from "../contexts/AddToCollectionContext";
import "./RecipeSearch.css";

export default function SearchByIngredients() {
  const { uid, currentUser } = useAuth();
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState("");
  const [number, setNumber] = useState(5);
  const [ranking, setRanking] = useState(1);
  const [ignorePantry, setIgnorePantry] = useState(true);
  const [searchClicked, setSearchClicked] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [recipeCollections, setRecipeCollections] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState({});
  const [creatingNewCollection, setCreatingNewCollection] = useState({});
  const [newCollectionTitle, setNewCollectionTitle] = useState({});
  const [expandedRecipes, setExpandedRecipes] = useState({});
  const [changed, setChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(false);

  const formattedIngredients = ingredients.split(";").map(i => i.trim()).join(";");

  useEffect(() => {
    async function fetchCollections() {
      if (uid) {
        try {
          const collectionsData = await getMyRecipeCollection();
          setRecipeCollections(collectionsData);
        } catch (err) {
          console.error("Failed to load collections:", err);
        }
      }
    }
    fetchCollections();
  }, [uid]);

  const handleSearch = async () => {
    // Validation
    if (!ingredients || ingredients.trim() === "") {
      toast.error("Please enter at least one ingredient");
      return false;
    }

    setIsLoading(true);
    setApiError(false);
    setRecipes([]);

    try {
      const recipeData = { 
        ingredients: formattedIngredients, 
        number, 
        ranking, 
        ignorePantry, 
        uid 
      };
      
      const data = await searchRecipeByIngredients(recipeData);
      
      // Handle case where API returns null, undefined, or empty array
      if (!data) {
        setApiError(true);
        toast.error("Recipe service is currently unavailable. Please try again later.");
        setRecipes([]);
        return false;
      }

      if (Array.isArray(data) && data.length === 0) {
        // Valid response but no recipes found
        setRecipes([]);
        toast.info("No recipes found with those ingredients. Try different combinations!");
        return true;
      }

      setRecipes(data);
      toast.success(`Found ${data.length} recipe${data.length !== 1 ? 's' : ''}!`);
      return true;

    } catch (err) {
      console.error("Search error:", err);
      setApiError(true);
      
      // Check for specific error types
      if (err.message?.includes("fetch") || err.message?.includes("network")) {
        toast.error("Network error. Please check your connection and try again.");
      } else if (err.response?.status === 503 || err.response?.status === 500) {
        toast.error("Recipe service is temporarily down. Please try again later.");
      } else {
        toast.error(`Failed to search recipes: ${err?.message || "Unknown error"}. Please try again.`);
      }
      
      setRecipes([]);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecipeExpansion = (recipeId) => {
    setExpandedRecipes(prev => ({
      ...prev,
      [recipeId]: !prev[recipeId]
    }));
  };

  const handleAddToMyRecipes = async (recipe) => {
    if (!uid) {
      toast.error("Please log in to save recipes");
      navigate("/login");
      return;
    }

    try {
      // Prepare recipe data
      const formData = new FormData();
      formData.append("title", recipe.title);
      formData.append("instruction", recipe.analyzedInstructions?.[0]?.steps?.map(s => s.step).join("\n\n") || "");
      formData.append("isPublic", "false");
      formData.append("numServings", recipe.servings || 0);
      formData.append("sourceName", "Kitchen Remix");
      formData.append("timePrepared", recipe.readyInMinutes || 0);
      formData.append("rating", 0);
      formData.append("cuisine", recipe.cuisines?.[0] || "");
      formData.append("difficulty", 0);
      formData.append("nutrition", "");
      
      // Extract ingredient names
      const ingredientNames = [
        ...(recipe.usedIngredients?.map(ing => ing.original) || []),
        ...(recipe.missedIngredients?.map(ing => ing.original) || [])
      ];
      formData.append("ingredients", JSON.stringify(ingredientNames));
      formData.append("comments", JSON.stringify([]));
      

      // Fetch and add image if available - with CORS handling
      if (recipe.image) {
        try {
          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(recipe.image)}`;
          const imageResponse = await fetch(proxyUrl);
          
          if (imageResponse.ok) {
            const imageBlob = await imageResponse.blob();
            const imageFile = new File([imageBlob], `${recipe.title}.jpg`, { type: 'image/jpeg' });
            formData.append("image", imageFile);
          } else {
            console.warn("Failed to fetch image, saving recipe without image");
          }
        } catch (imgError) {
          console.warn("Image fetch failed, saving recipe without image:", imgError);
        }
      }

      await addRecipe(formData);
      toast.success("Recipe saved to your collection!");
      
      // Clear selections
      setSelectedCollections({ ...selectedCollections, [recipe.id]: { ids: [], titles: [] } });
    } catch (err) {
      toast.error(`Failed to save recipe: ${err?.message || err}`);
    }
  };

  const handleCreateNewCollection = async (recipeId) => {
    const collectionTitle = newCollectionTitle[recipeId];
    if (!collectionTitle || collectionTitle.trim() === '') {
      toast.error("Please enter a collection name");
      return;
    }

    try {
      const newCol = await addRecipeCollection({
        title: collectionTitle,
        description: "",
        isPublic: false,
      });
      
      setRecipeCollections([...recipeCollections, newCol]);
      
      const currentSelections = selectedCollections[recipeId] || { ids: [], titles: [] };
      setSelectedCollections({
        ...selectedCollections,
        [recipeId]: {
          ids: [...currentSelections.ids, newCol._id],
          titles: [...currentSelections.titles, newCol.title]
        }
      });
      
      setCreatingNewCollection({ ...creatingNewCollection, [recipeId]: false });
      setNewCollectionTitle({ ...newCollectionTitle, [recipeId]: "" });
      toast.success("Collection created and selected!");
    } catch (err) {
      toast.error(`Failed to create collection: ${err?.message || err}`);
    }
  };

  // Handle collection dropdown - redirect to login if not logged in
  const handleCollectionDropdownClick = (recipeId) => {
    if (!uid) {
      toast.error("Please log in to add recipes to collections");
      navigate("/login");
      return;
    }
    toggleCollectionDropdown(recipeId);
  };

  return (
    <div className="search-container">
      <h1>Kitchen Remix</h1>
      <p>
        Kitchen Remix helps you turn the ingredients you already have into delicious meals. 
        Just enter what's in your pantry, and we'll suggest recipes you can cook today!
      </p>

      {/* Ingredients */}
      <div className="form-group">
        <label>
          Ingredients * 
          <span className="tooltip">Enter ingredients you have, separated by semicolon (;).</span>
          <p style ={{color: 'grey', fontWeight: '50px', fontSize: '12px'}}>Separated by semicolon (;)</p>
        </label>
        <input
          type="text"
          placeholder="e.g. tomato; cheese; basil"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* Number of recipes */}
      <div className="form-group">
        <label>
          Number of Recipes
          <span className="tooltip">Enter how many recipes you want to see.</span>
        </label>
        <input
          type="number"
          placeholder="e.g. 5"
          value={number}
          onChange={(e) => setNumber(Number(e.target.value))}
          disabled={isLoading}
        />
      </div>

      {/* Ranking */}
      <div className="form-group">
        <label>
          Ranking
          <span className="tooltip">1 = maximize used ingredients, 2 = minimize missing ingredients.</span>
        </label>
        <input
          type="number"
          placeholder="1 or 2"
          value={ranking}
          onChange={(e) => setRanking(Number(e.target.value))}
          disabled={isLoading}
        />
      </div>

      {/* Ignore Pantry */}
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={ignorePantry}
            onChange={(e) => setIgnorePantry(e.target.checked)}
            disabled={isLoading}
          />
          Ignore Pantry
          <span className="tooltip">Toggle to ignore items you already have in your pantry.</span>
        </label>
      </div>

      {/* Search Button */}
      <button 
        onClick={() => { 
          setSearchClicked(true); 
          handleSearch(); 
        }} 
        className="search-btn"
        disabled={isLoading}
      >
        {isLoading ? "Searching..." : "Search"}
      </button>

      {/* Display selected ingredients */}
      {ingredients && ingredients.length > 0 && (
        <div className="ingredients-list-search">
          <h2>Your Ingredients</h2>
          <ul>
            {ingredients
              .split(";")
              .map(item => item.trim())
              .filter(item => item.length > 0) 
              .map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() =>
                      setIngredients(prev =>
                        prev
                          .split(";")
                          .map(i => i.trim())
                          .filter((_, i) => i !== index)
                          .join("; ")
                      )
                    }
                    disabled={isLoading}
                  >
                    ×
                  </button>
                  {item}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="loading-state">
          <p>🔍 Searching for recipes...</p>
        </div>
      )}

      {/* API Error Message */}
      {apiError && searchClicked && !isLoading && (
        <div className="api-error">
          <h3>⚠️ Service Unavailable</h3>
          <p>We're having trouble connecting to the recipe service right now.</p>
          <p>Please try again in a few moments.</p>
          <button 
            onClick={() => {
              setSearchClicked(true);
              handleSearch();
            }}
            className="search-btn"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Search results */}
      {!isLoading && searchClicked && recipes.length > 0 && (
        <div className="search-results">
          <h2 className="results-title">Found {recipes.length} Recipe{recipes.length !== 1 ? 's' : ''}</h2>
          
          {recipes.map((recipe) => {
            const isExpanded = expandedRecipes[recipe.id];
            
            return (
              <div key={recipe.id} className="recipe-card-search">
                {/* Recipe Image */}
                {recipe.image && (
                  <img 
                    src={`https://corsproxy.io/?${encodeURIComponent(recipe.image)}`}
                    alt={recipe.title}
                    className="recipe-image-search"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}

                {/* Recipe Header */}
                <div className="recipe-header-search">
                  <h3>{recipe.title}</h3>
                  <div className="recipe-meta">
                    <span>⏱️ {recipe.readyInMinutes} min</span>
                    <span>🍽️ {recipe.servings} servings</span>
                    {recipe.cuisines?.length > 0 && (
                      <span>🌍 {recipe.cuisines.join(", ")}</span>
                    )}
                  </div>
                </div>

                {/* Ingredients Summary */}
                <div className="ingredients-summary">
                  {recipe.usedIngredients?.length > 0 && (
                    <div className="used-ingredients">
                      <strong>✓ Have ({recipe.usedIngredients.length}):</strong>
                      <span>{recipe.usedIngredients.map(ing => ing.name).join("; ")}</span>
                    </div>
                  )}
                  {recipe.missedIngredients?.length > 0 && (
                    <div className="missed-ingredients">
                      <strong>✗ Need ({recipe.missedIngredients.length}):</strong>
                      <span>{recipe.missedIngredients.map(ing => ing.name).join("; ")}</span>
                    </div>
                  )}
                </div>

                {/* Expandable Details */}
                {isExpanded && (
                  <div className="recipe-details-expanded">
                    <div className="section">
                      <h4>All Ingredients</h4>
                      <ul className="ingredients-list">
                        {recipe.usedIngredients?.map((ing, i) => (
                          <li key={`used-${i}`} className="ingredient-used">
                            ✓ {ing.original}
                          </li>
                        ))}
                        {recipe.missedIngredients?.map((ing, i) => (
                          <li key={`missed-${i}`} className="ingredient-missed">
                            ✗ {ing.original}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {recipe.analyzedInstructions?.[0]?.steps && (
                      <div className="section">
                        <h4>Instructions</h4>
                        <ol className="instructions-text">
                          {recipe.analyzedInstructions[0].steps.map((step) => (
                            <li key={step.number}>{step.step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Action Buttons Table */}
                <table className="recipe-actions-grid-box">
                  <tbody className="tbody-grid-box">
                    <tr>
                      <td>
                        <button 
                          onClick={() => toggleRecipeExpansion(recipe.id)}
                          className="update-recipe-btn"
                        >
                          {isExpanded ? "Show Less" : "Show More"}
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <button 
                          onClick={() => handleAddToMyRecipes(recipe)}
                          className="delete-recipe-btn"
                        >
                          {uid ? "Save Recipe" : "Login to Save"}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {/* No results found */}
      {!isLoading && searchClicked && recipes.length === 0 && !apiError && (
        <div className="no-results">
          <p>No recipes found with those ingredients. Try different combinations!</p>
        </div>
      )}
    </div>
  );
}