import { authenticatedFetch, optionalAuthFetch } from "./api";
import { toast } from "react-hot-toast";

/**
 * Add a new recipe collection
 */
export async function addRecipeCollection(recipeRecipeCollectionData, onNavigate) {
  try {
    const res = await authenticatedFetch("/recipeCollections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipeRecipeCollectionData),
    });
    return res;
  } catch (err) {
    handleAuthError(err, onNavigate);
  }
}

/**
 * Get all recipe collections for the logged-in user (if authenticated)
 */
export async function getUserRecipeCollection() {
  try {
    return await optionalAuthFetch("/recipeCollections");
  } catch (err) {
    toast.error(err.message);
  }
}

/**
 * Update an existing recipe collection
 */
export async function updateRecipeCollection(recipeRecipeCollectionId, recipeRecipeCollectionData, onNavigate) {
  try {
    const res = await authenticatedFetch(`/recipeCollections/${recipeRecipeCollectionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipeRecipeCollectionData),
    });
    return res;
  } catch (err) {
    handleAuthError(err, onNavigate);
  }
}

/**
 * Get a recipe collection by its ID
 */
export async function getRecipeCollectionById(recipeRecipeCollectionId, onNavigate) {
  try {
    return await optionalAuthFetch(`/recipeCollections/${recipeRecipeCollectionId}`, { method: "GET" });
  } catch (err) {
    handleAuthError(err, onNavigate);
  }
}

/**
 * Delete a recipe collection by its ID
 */
export async function deleteRecipeCollection(recipeRecipeCollectionId, onNavigate) {
  try {
    return await authenticatedFetch(`/recipeCollections/${recipeRecipeCollectionId}`, { method: "DELETE" });
  } catch (err) {
    handleAuthError(err, onNavigate);
  }
}

/**
 * Get dashboard view of all collections for the user
 */
export async function getMyRecipeCollection(onNavigate) {
  try {
    return await authenticatedFetch("/recipeCollections/dashboard");
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
 * Search collections
 */
export async function searchCollection(searchParams) {
  try {    
    // Build query string from searchParams
    const queryParams = new URLSearchParams();
    if (searchParams.query) queryParams.append('q', searchParams.query);
    if (searchParams.limit) queryParams.append('limit', searchParams.limit);
    
    // Use GET request with query params 
    const data = await optionalAuthFetch(`/recipeCollections/search?${queryParams.toString()}`, {
      method: "GET"
    });
    
    // authenticatedFetch already returns parsed JSON
    return data.collections || [];
  } catch (error) {
    console.error('Collection search error:', error);
    toast.error('Failed to search collections: ' + error.message);
    return [];
  }
}