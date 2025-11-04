import { Router } from 'express';
import multer, {memoryStorage} from 'multer';
import { searchRecipes, getAllRecipe, getRecipeById, createRecipe, updateRecipe, deleteRecipe, getAllMyRecipe, addRecipeToCollection, removeRecipeFromCollection } from '../controllers/recipeController.js';
import { verifyFirebaseToken, optionalFirebaseToken } from '../middleware/auth.js';

const router = Router();

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
});


// Protected routes 
router.post('/search', verifyFirebaseToken, searchRecipes);
router.get('/dashboard', verifyFirebaseToken, getAllMyRecipe);
router.post('/add-to-collection', verifyFirebaseToken, addRecipeToCollection);
router.post('/remove-from-collection', verifyFirebaseToken, removeRecipeFromCollection);
router.post("/", verifyFirebaseToken, upload.single("image"), createRecipe); 
router.put("/:id", verifyFirebaseToken, upload.single("image"), updateRecipe); 
router.delete("/:id", verifyFirebaseToken, deleteRecipe);

// Public routes 
router.get("/", optionalFirebaseToken, getAllRecipe);
router.get("/:id", optionalFirebaseToken, getRecipeById);

export default router;