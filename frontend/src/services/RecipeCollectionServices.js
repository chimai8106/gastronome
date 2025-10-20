import { authenticatedFetch, publicFetch } from './api';

export async function addRecipeCollection(recipeRecipeCollectionData) {
  return authenticatedFetch('/recipeRecipeCollections', {
    method: 'POST',
    body: JSON.stringify(recipeRecipeCollectionData),
  });
}

export async function getUserRecipeCollection() {
  return publicFetch('/recipeRecipeCollections');
}

export async function updateRecipeCollection(recipeRecipeCollectionId, recipeRecipeCollectionData) {
  return authenticatedFetch(`/recipeRecipeCollections/${recipeRecipeCollectionId}`, {
    method: 'PUT',
    body: JSON.stringify(recipeRecipeCollectionData),
  });
}

export async function getRecipeCollectionById(recipeRecipeCollectionId) {
  return authenticatedFetch(`/recipeRecipeCollections/${recipeRecipeCollectionId}`, {
    method: 'GET'
    });
}
export async function deleteRecipeCollection(recipeRecipeCollectionId) {
  return authenticatedFetch(`/recipeRecipeCollections/${recipeRecipeCollectionId}`, {
    method: 'DELETE',
  });
}
export async function getMyRecipeCollection(){
  return authenticatedFetch('/recipeRecipeCollections/dashboard');
}

