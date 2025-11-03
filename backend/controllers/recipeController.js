import fetch from 'node-fetch';
import Recipe from '../models/Recipe.js';
import RecipeCollection from '../models/RecipeCollection.js';
import { getImagePresignedUrl, uploadToS3, deleteImage, addPresignedUrlToRecipe, addPresignedUrlsToRecipes } from '../db/s3.mjs';

//search recipe based on ingredients
export const searchRecipes = async (req, res) => {
  const { ingredients, number, ranking, ignorePantry, uid } = req.body;
  if (uid === null) {
    res.status(401).json({ message: "You need to log in to search recipe" });
  }
  const apiKey = process.env.SPOONACULAR_API_KEY;
  
  const basicResponse = await fetch(
    `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients}&number=${number}&ranking=${ranking}&ignorePantry=${ignorePantry}&apiKey=${apiKey}`
  );
  const basicData = await basicResponse.json();

  const detailedData = await Promise.all(
    basicData.map(async (recipe) => {
      const detailResponse = await fetch(
        `https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${apiKey}`
      );
      return detailResponse.json();
    })
  );

  const mergedRecipes = detailedData.map((detail) => {
    const match = basicData.find((r) => r.id === detail.id);
    return {
      ...detail,
      usedIngredients: match.usedIngredients,
      missedIngredients: match.missedIngredients,
    };
  });

  res.json(mergedRecipes);
};

//create a new recipe
export const createRecipe = async (req, res) => {
  try {
    const {
      title, instruction, isPublic, numServings, sourceName,
      timePrepared, rating, cuisine, difficulty, nutrition,
      ingredients, comments, recipeCollectionID, recipeCollectionName
    } = req.body;
    
    const file = req.file;
    let imageKey = null;
    
    if (file) {
      // Upload to S3 and get the KEY (not URL)
      const { error, key } = await uploadToS3({ file, uid: req.user.uid });
      if (error) {
        return res.status(500).json({ 
          message: "Internal server error", 
          error: error.message 
        });
      }
      imageKey = key; // Store ONLY the key in database
    }
    
    // Parse JSON arrays
    let parsedIngredients = [];
    let parsedComments = [];
    let parseRecipeCollectionID = [];
    let parseRecipeCollectionName = [];

    try {
      parsedIngredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients || [];
    } catch (e) {
      parsedIngredients = [];
    }

    try {
      parsedComments = typeof comments === 'string' ? JSON.parse(comments) : comments || [];
    } catch (e) {
      parsedComments = [];
    }

    try {
      parseRecipeCollectionID = typeof recipeCollectionID === 'string' ? JSON.parse(recipeCollectionID) : recipeCollectionID || [];
    } catch (e) {
      parseRecipeCollectionID = [];
    }

    try {
      parseRecipeCollectionName = typeof recipeCollectionName === 'string' ? JSON.parse(recipeCollectionName) : recipeCollectionName || [];
    } catch (e) {
      parseRecipeCollectionName = [];
    }

    const recipe = new Recipe({
      title,
      instruction,
      imageKey, // Store the S3 key, not the URL
      ingredients: parsedIngredients,
      comments: parsedComments,
      isPublic: isPublic === 'true' || isPublic === true,
      numServings: Number(numServings),
      sourceName,
      timePrepared: Number(timePrepared),
      rating: Number(rating),
      likes: 0,
      cuisine,
      difficulty: Number(difficulty),
      nutrition,
      uid: req.user.uid,
      authorName: req.user.displayName,
      recipeCollectionID: parseRecipeCollectionID,
      recipeCollectionName: parseRecipeCollectionName
    });

    const newRecipe = await recipe.save();
    
    // Generate presigned URL before sending to frontend
    const recipeWithUrl = await addPresignedUrlToRecipe(newRecipe.toObject());

    // Add to collections with imageKey (not presigned URL)
    if (parseRecipeCollectionID.length > 0) {
      const recipePreview = {
        _id: newRecipe._id,
        title: newRecipe.title,
        imageKey: newRecipe.imageKey, // Store KEY, not URL
        cuisine: newRecipe.cuisine,
        difficulty: newRecipe.difficulty,
        timePrepared: newRecipe.timePrepared,
        rating: newRecipe.rating,
        likes: newRecipe.likes
      };

      await Promise.all(
        parseRecipeCollectionID.map(async (collectionId) => {
          await RecipeCollection.findByIdAndUpdate(
            collectionId,
            { $addToSet: { recipes: recipePreview } },
            { new: true }
          );
        })
      );
    }

    res.status(201).json(recipeWithUrl);
  } catch (error) {
    console.error("Error in createRecipe controller", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

//get all public recipe
export async function getAllRecipe(_, res) {
  try {
    const recipes = await Recipe.find({ isPublic: true }).sort({ likes: -1 });
    // Generate presigned URLs for all recipes before sending
    const recipesWithUrls = await addPresignedUrlsToRecipes(recipes.map(r => r.toObject()));
    res.status(200).json(recipesWithUrls);
  } catch (error) {
    console.error("Error in getAllRecipe controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

//get all my recipe
export async function getAllMyRecipe(req, res) {
  try {
    const recipes = await Recipe.find({ uid: req.user.uid }).sort({ likes: -1 });
    // Generate presigned URLs for all recipes before sending
    const recipesWithUrls = await addPresignedUrlsToRecipes(recipes.map(r => r.toObject()));
    res.status(200).json(recipesWithUrls);
  } catch (error) {
    console.error("Error in getAllMyRecipe controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

//get a recipe by its ID
export async function getRecipeById(req, res) {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found!" });
    
    if (!recipe.isPublic && (!req.user || recipe.uid !== req.user.uid)) {
      return res.status(403).json({ message: "You are not allowed to view this recipe" });
    }
    
    // Generate presigned URL before sending
    const recipeWithUrl = await addPresignedUrlToRecipe(recipe.toObject());
    res.json(recipeWithUrl);
  } catch (error) {
    console.error("Error in getRecipeById controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

//update my recipe
export async function updateRecipe(req, res) {
  try {
    const existingRecipe = await Recipe.findOne({
      _id: req.params.id,
      uid: req.user.uid
    });

    if (!existingRecipe) {
      return res.status(404).json({ message: "Recipe not found or you don't have permission" });
    }

    const {
      title, instruction, isPublic, numServings, sourceName,
      timePrepared, rating, likes, cuisine, difficulty, nutrition,
      ingredients, comments, recipeCollectionID, recipeCollectionName
    } = req.body;

    const updateData = { uid: req.user.uid };
    const file = req.file;
    
    // Handle image upload
    if (file) {
      // Delete old image if exists
      if (existingRecipe.imageKey) {
        await deleteImage(existingRecipe.imageKey);
      }

      // Upload new image
      const { error, key } = await uploadToS3({ file, uid: req.user.uid });
      if (error) {
        return res.status(500).json({ 
          message: "Internal server error", 
          error: error.message 
        });
      }
      updateData.imageKey = key; // Store the new key
    }

    // Update other fields
    if (title !== undefined) updateData.title = title;
    if (instruction !== undefined) updateData.instruction = instruction;
    if (isPublic !== undefined) updateData.isPublic = isPublic === 'true' || isPublic === true;
    if (numServings !== undefined) updateData.numServings = Number(numServings);
    if (sourceName !== undefined) updateData.sourceName = sourceName;
    if (timePrepared !== undefined) updateData.timePrepared = Number(timePrepared);
    if (rating !== undefined) updateData.rating = Number(rating);
    if (likes !== undefined) updateData.likes = Number(likes);
    if (cuisine !== undefined) updateData.cuisine = cuisine;
    if (difficulty !== undefined) updateData.difficulty = Number(difficulty);
    if (nutrition !== undefined) updateData.nutrition = nutrition;
    
    if (ingredients !== undefined) {
      try {
        updateData.ingredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
      } catch (e) {
        updateData.ingredients = [];
      }
    }
    
    if (comments !== undefined) {
      try {
        updateData.comments = typeof comments === 'string' ? JSON.parse(comments) : comments;
      } catch (e) {
        updateData.comments = [];
      }
    }

    let parseRecipeCollectionID = [];
    let parseRecipeCollectionName = [];

    if (recipeCollectionID !== undefined) {
      try {
        parseRecipeCollectionID = typeof recipeCollectionID === 'string' ? JSON.parse(recipeCollectionID) : recipeCollectionID || [];
        updateData.recipeCollectionID = parseRecipeCollectionID;
      } catch (e) {
        parseRecipeCollectionID = [];
        updateData.recipeCollectionID = [];
      }
    }

    if (recipeCollectionName !== undefined) {
      try {
        parseRecipeCollectionName = typeof recipeCollectionName === 'string' ? JSON.parse(recipeCollectionName) : recipeCollectionName || [];
        updateData.recipeCollectionName = parseRecipeCollectionName;
      } catch (e) {
        parseRecipeCollectionName = [];
        updateData.recipeCollectionName = [];
      }
    }

    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedRecipe) {
      return res.status(404).json({ message: "Recipe not found after update" });
    }

    // Generate presigned URL before sending
    const recipeWithUrl = await addPresignedUrlToRecipe(updatedRecipe.toObject());

    // Update collections
    if (recipeCollectionID !== undefined) {
      const oldCollectionIDs = existingRecipe.recipeCollectionID || [];
      const collectionsToRemoveFrom = oldCollectionIDs.filter(id => !parseRecipeCollectionID.includes(id));
      
      if (collectionsToRemoveFrom.length > 0) {
        await Promise.all(
          collectionsToRemoveFrom.map(async (collectionId) => {
            await RecipeCollection.findByIdAndUpdate(
              collectionId,
              { $pull: { recipes: { _id: req.params.id } } } 
            );
          })
        );
      }

      const collectionsToAddTo = parseRecipeCollectionID.filter(id => !oldCollectionIDs.includes(id));
      
      if (collectionsToAddTo.length > 0) {
        const recipePreview = {
          _id: updatedRecipe._id,
          title: updatedRecipe.title,
          imageKey: updatedRecipe.imageKey, // Store KEY, not URL
          cuisine: updatedRecipe.cuisine,
          difficulty: updatedRecipe.difficulty,
          timePrepared: updatedRecipe.timePrepared,
          rating: updatedRecipe.rating,
          likes: updatedRecipe.likes
        };

        await Promise.all(
          collectionsToAddTo.map(async (collectionId) => {
            await RecipeCollection.findByIdAndUpdate(
              collectionId,
              { $addToSet: { recipes: recipePreview } }
            );
          })
        );
      }

      const collectionsToUpdate = parseRecipeCollectionID.filter(id => oldCollectionIDs.includes(id));
      
      if (collectionsToUpdate.length > 0) {
        const recipePreview = {
          _id: updatedRecipe._id,
          title: updatedRecipe.title,
          imageKey: updatedRecipe.imageKey, // Store KEY, not URL
          cuisine: updatedRecipe.cuisine,
          difficulty: updatedRecipe.difficulty,
          timePrepared: updatedRecipe.timePrepared,
          rating: updatedRecipe.rating,
          likes: updatedRecipe.likes
        };

        await Promise.all(
          collectionsToUpdate.map(async (collectionId) => {
            await RecipeCollection.findByIdAndUpdate(
              collectionId,
              { $pull: { recipes: { _id: req.params.id } } }
            );
            await RecipeCollection.findByIdAndUpdate(
              collectionId,
              { $addToSet: { recipes: recipePreview } }
            );
          })
        );
      }
    }

    res.status(200).json(recipeWithUrl);
  } catch (error) {
    console.error("Error in updateRecipe controller", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

//delete my recipe
export async function deleteRecipe(req, res) {
  try {
    const recipe = await Recipe.findOne({
      _id: req.params.id,
      uid: req.user.uid,
    });
    
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found or you don't have permission" });
    }

    // Remove recipe from all collections
    if (recipe.recipeCollectionID && recipe.recipeCollectionID.length > 0) {
      await Promise.all(
        recipe.recipeCollectionID.map(async (collectionId) => {
          await RecipeCollection.findByIdAndUpdate(
            collectionId,
            { $pull: { recipes: { _id: req.params.id } } }
          );
        })
      );
    }
    
    // Delete image from S3 using the KEY (not URL)
    if (recipe.imageKey) {
      const result = await deleteImage(recipe.imageKey);
      if (result.error) {
        console.error('Failed to delete image:', result.error);
        // Continue with recipe deletion even if image delete fails
      }
    }

    await Recipe.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: "Recipe deleted successfully!" });
  } catch (error) {
    console.error("Error in deleteRecipe controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}