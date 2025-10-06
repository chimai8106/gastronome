import { Router } from 'express';
import { searchRecipes, getAllRecipe, getRecipeById, createRecipe, updateRecipe, deleteRecipe, getAllMyRecipe } from '../controllers/recipeController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = Router();

// POST /api/recipes/search



// Protected routes 
router.post('/search',verifyFirebaseToken, searchRecipes);
router.get('/dashboard',verifyFirebaseToken, getAllMyRecipe);
router.post("/", verifyFirebaseToken, createRecipe); // Must be logged in to create
router.put("/:id", verifyFirebaseToken, updateRecipe); // Must own the recipe
router.delete("/:id", verifyFirebaseToken, deleteRecipe); // Must own the recipe

// Public routes 

router.get("/", getAllRecipe); // Public recipes only
router.get("/:id", getRecipeById); // Can view public recipes or own recipes

export default router;