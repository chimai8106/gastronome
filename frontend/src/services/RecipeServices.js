import { authenticatedFetch, publicFetch } from './api';

export async function addRecipe(recipeData) {
  return authenticatedFetch('/recipes', {
    method: 'POST',
    body: JSON.stringify(recipeData),
  });
}

export async function getUserRecipes() {
  return publicFetch('/recipes');
}

export async function updateRecipe(recipeId, recipeData) {
  return authenticatedFetch(`/recipes/${recipeId}`, {
    method: 'PUT',
    body: JSON.stringify(recipeData),
  });
}

export async function deleteRecipe(recipeId) {
  return authenticatedFetch(`/recipes/${recipeId}`, {
    method: 'DELETE',
  });
}
export async function getMyRecipes(){
  return authenticatedFetch('/recipes/dashboard');
}

export async function searchRecipeByIngredients(recipeData){
  return authenticatedFetch(`/recipes/search`, {
    method: 'POST',
    body: JSON.stringify(recipeData),
  });

}