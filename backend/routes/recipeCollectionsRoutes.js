import { Router } from 'express';
import multer from 'multer';
import { getAllRecipeCollection, getRecipeCollectionById, createRecipeCollection, updateRecipeCollection, deleteRecipeCollection, getAllMyRecipeCollection, searchCollectionsByText } from '../controllers/recipeCollectionController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = Router();

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
});

// POST /api/recipes/search

// Protected routes 
//router.post('/search',verifyFirebaseToken, searchRecipes);
router.get('/dashboard', verifyFirebaseToken, getAllMyRecipeCollection);
router.post("/", verifyFirebaseToken, upload.none(), createRecipeCollection); 
router.put("/:id", verifyFirebaseToken, upload.none(), updateRecipeCollection); 
router.delete("/:id", verifyFirebaseToken, deleteRecipeCollection);
router.get("/:id", verifyFirebaseToken, getRecipeCollectionById);
router.post('/search', verifyFirebaseToken, searchCollectionsByText);

// Public routes 
router.get("/", getAllRecipeCollection);

export default router;