import { authenticatedFetch, optionalAuthFetch } from "./api";
import { toast } from "react-hot-toast";

/**
 * Add a new recipe
 */
export async function addRecipe(recipeData, onNavigate) {
  try {
    const isFormData = recipeData instanceof FormData;
    const res = await authenticatedFetch("/recipes", {
      method: "POST",
      headers: isFormData ? undefined : { "Content-Type": "application/json" },
      body: isFormData ? recipeData : JSON.stringify(recipeData),
    });
    return res;
  } catch (err) {
    handleAuthError(err, onNavigate);
  }
}

/**
 * Get all recipes for the logged-in user (if authenticated)
 */
export async function getUserRecipes() {
  try {
    return await optionalAuthFetch("/recipes");
  } catch (err) {
    toast.error(err.message);
  }
}

/**
 * Update an existing recipe
 */
export async function updateRecipe(recipeId, recipeData, onNavigate) {
  try {
    const isFormData = recipeData instanceof FormData;
    const res = await authenticatedFetch(`/recipes/${recipeId}`, {
      method: "PUT",
      headers: isFormData ? undefined : { "Content-Type": "application/json" },
      body: isFormData ? recipeData : JSON.stringify(recipeData),
    });
    return res;
  } catch (err) {
    handleAuthError(err, onNavigate);
  }
}

/**
 * Delete a recipe by ID
 */
export async function deleteRecipe(recipeId, onNavigate) {
  try {
    return await authenticatedFetch(`/recipes/${recipeId}`, { method: "DELETE" });
  } catch (err) {
    handleAuthError(err, onNavigate);
  }
}

/**
 * Get a recipe by ID
 */
export async function getRecipeById(recipeId, onNavigate) {
  try {
    return await optionalAuthFetch(`/recipes/${recipeId}`, { method: "GET" });
  } catch (err) {
    handleAuthError(err, onNavigate);
  }
}

/**
 * Get all recipes for dashboard view
 */
export async function getMyRecipes(onNavigate) {
  try {
    return await authenticatedFetch("/recipes/dashboard");
  } catch (err) {
    handleAuthError(err, onNavigate);
  }
}

/**
 * Search for recipes by ingredients
 */
export async function searchRecipeByIngredients(recipeData, onNavigate) {
  try {
    return await authenticatedFetch("/recipes/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipeData),
    });
  } catch (err) {
    handleAuthError(err, onNavigate);
  }
}

/**
 * Add a recipe to a collection
 */
export async function addRecipeToCollection(recipeId, collectionId, onNavigate) {
  try {
    return await authenticatedFetch("/recipes/add-to-collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId, collectionId }),
    });
  } catch (err) {
    handleAuthError(err, onNavigate);
  }
}

/**
 * Remove a recipe from a collection
 */
export async function removeRecipeFromCollection(recipeId, collectionId, onNavigate) {
  try {
    return await authenticatedFetch("/recipes/remove-from-collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId, collectionId }),
    });
  } catch (err) {
    handleAuthError(err, onNavigate);
  }
}

/**
 * Helper for login-required actions
 */
function handleAuthError(err, onNavigate) {
  if (err.message.includes("logged in")) {
    toast.error("Please log in to continue");
    if (onNavigate) onNavigate("/login");
  } else {
    toast.error(err.message);
  }
}

/**
 * Import recipe
 */
export async function importRecipe(recipeUrl) {
  try {    
    const url = process.env.NODE_ENV !== "production" ? "http://localhost:5001/recipe-parser" : '/recipe-parser'
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ link: recipeUrl })
    });
    
    const data = await res.json();
    return data;
  } catch (error) {
    toast.error('Error: ' + error.message);
    throw error;
  } 
}

/**
 * Search recipes 
 */
export async function searchRecipe(searchParams) {
  try {    
    // Build query string from searchParams
    const queryParams = new URLSearchParams();
    if (searchParams.query) queryParams.append('q', searchParams.query);
    if (searchParams.cuisine) queryParams.append('cuisine', searchParams.cuisine);
    if (searchParams.maxDifficulty) queryParams.append('maxDifficulty', searchParams.maxDifficulty);
    if (searchParams.minRating) queryParams.append('minRating', searchParams.minRating);
    if (searchParams.limit) queryParams.append('limit', searchParams.limit);
    
    // Use POST request
    const data = await authenticatedFetch(`/recipes/search-text?${queryParams.toString()}`, {
      method: "POST"
    });
    
    return data.recipes || [];
  } catch (error) {
    console.error('Recipe search error:', error);
    toast.error('Failed to search recipes: ' + error.message);
    return [];
  } 
}