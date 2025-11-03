import { Router } from 'express';
import multer, {memoryStorage} from 'multer';
import { searchRecipes, getAllRecipe, getRecipeById, createRecipe, updateRecipe, deleteRecipe, getAllMyRecipe } from '../controllers/recipeController.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = Router();

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
});


// Protected routes 
router.post('/search', verifyFirebaseToken, searchRecipes);
router.get('/dashboard', verifyFirebaseToken, getAllMyRecipe);
router.post("/", verifyFirebaseToken, upload.single("image"), createRecipe); 
router.put("/:id", verifyFirebaseToken, upload.single("image"), updateRecipe); 
router.delete("/:id", verifyFirebaseToken, deleteRecipe);

// Public routes 
router.get("/", getAllRecipe);
router.get("/:id", getRecipeById);

export default router;