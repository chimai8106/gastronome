import { Router } from 'express';
import multer from 'multer';
import { getAllRecipeCollection, getRecipeCollectionById, createRecipeCollection, updateRecipeCollection, deleteRecipeCollection, getAllMyRecipeCollection, searchCollectionsByText } from '../controllers/recipeCollectionController.js';
import { verifyFirebaseToken, optionalFirebaseToken } from '../middleware/auth.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

// Specific routes FIRST (before /:id)
router.get('/dashboard', verifyFirebaseToken, getAllMyRecipeCollection);
router.get('/search', optionalFirebaseToken, searchCollectionsByText);

// Protected routes
router.post("/", verifyFirebaseToken, upload.none(), createRecipeCollection); 
router.put("/:id", verifyFirebaseToken, upload.none(), updateRecipeCollection); 
router.delete("/:id", verifyFirebaseToken, deleteRecipeCollection);


router.get("/", getAllRecipeCollection);
router.get("/:id", optionalFirebaseToken, getRecipeCollectionById);

export default router;