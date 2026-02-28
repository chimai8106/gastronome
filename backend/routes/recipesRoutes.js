import { Router } from 'express';
import multer from 'multer';
import { searchRecipes, getAllRecipe, getRecipeById, createRecipe, updateRecipe, deleteRecipe, getAllMyRecipe, addRecipeToCollection, removeRecipeFromCollection, searchRecipesByText } from '../controllers/recipeController.js';
import { verifyFirebaseToken, optionalFirebaseToken } from '../middleware/auth.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

// Specific routes FIRST (before /:id)
router.get('/dashboard', verifyFirebaseToken, getAllMyRecipe);
router.get('/search-text', optionalFirebaseToken, searchRecipesByText);
router.post('/search', optionalFirebaseToken, searchRecipes);

// Protected routes

router.post('/add-to-collection', verifyFirebaseToken, addRecipeToCollection);
router.post('/remove-from-collection', verifyFirebaseToken, removeRecipeFromCollection);
router.post("/", verifyFirebaseToken, upload.single("image"), createRecipe); 
router.put("/:id", verifyFirebaseToken, upload.single("image"), updateRecipe); 
router.delete("/:id", verifyFirebaseToken, deleteRecipe);

router.get("/", optionalFirebaseToken, getAllRecipe);
router.get("/:id", optionalFirebaseToken, getRecipeById);

export default router;