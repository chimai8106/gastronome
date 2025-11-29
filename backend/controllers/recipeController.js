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
      authorName: "Kitchen Remix",
      uid: 1111
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
      ingredients, comments, recipeCollectionID, recipeCollectionName, authorName, myComment
    } = req.body;
    
    const file = req.file;
    let imageKey = null;
    
    if (file) {
      //Upload to S3 and get the key 
      const { error, key } = await uploadToS3({ file, uid: req.user.uid });
      if (error) {
        return res.status(500).json({ 
          message: "Internal server error", 
          error: error.message 
        });
      }
      imageKey = key; 
    }
    
    // Parse JSON arrays
    let parsedIngredients = [];
    let parsedComments = [];
    let parseRecipeCollectionID = [];

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

    const recipe = new Recipe({
      title,
      instruction,
      imageKey,
      ingredients: parsedIngredients,
      comments: parsedComments,
      isPublic: isPublic === 'true' || isPublic === true,
      numServings: numServings,
      sourceName,
      timePrepared: timePrepared,
      rating: Number(rating),
      likes: 0,
      cuisine,
      difficulty: Number(difficulty),
      nutrition,
      uid: req.user.uid,
      authorName: authorName || req.user.displayName,
      myComment
    });

    const newRecipe = await recipe.save();
    
    // Generate presigned URL before sending to frontend
    const recipeWithUrl = await addPresignedUrlToRecipe(newRecipe.toObject());

    // Add to my collections only (verify they belong to me)
    if (parseRecipeCollectionID.length > 0) {
      const recipePreview = {
        _id: newRecipe._id,
        title: newRecipe.title,
        imageKey: newRecipe.imageKey, 
        cuisine: newRecipe.cuisine,
        difficulty: newRecipe.difficulty,
        timePrepared: newRecipe.timePrepared,
        rating: newRecipe.rating,
        likes: newRecipe.likes,
        uid: newRecipe.uid, 
        authorName: newRecipe.authorName,
        myComment
      };

      await Promise.all(
        parseRecipeCollectionID.map(async (collectionId) => {
          // Only update collections that belong to me
          await RecipeCollection.findOneAndUpdate(
            { _id: collectionId, uid: req.user.uid },
            { $addToSet: { recipes: recipePreview } },
            { new: true }
          );
        })
      );
    }

    // Add myCollections info
    const myCollections = await RecipeCollection.find({
      uid: req.user.uid,
      'recipes._id': newRecipe._id
    }).select('_id title');
    
    recipeWithUrl.myCollections = myCollections.map(col => ({
      _id: col._id,
      title: col.title
    }));

    res.status(201).json(recipeWithUrl);
  } catch (error) {
    console.error("Error in createRecipe controller", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

//get all public recipe
export async function getAllRecipe(req, res) {
  try {
    const recipes = await Recipe.find({ isPublic: true }).sort({ likes: -1 });
    // Generate presigned URLs for all recipes before sending
    const recipesWithUrls = await addPresignedUrlsToRecipes(recipes.map(r => r.toObject()));
    
    // If user is logged in, add which collections contain each recipe
    if (req.user) {
      const myCollections = await RecipeCollection.find({ uid: req.user.uid });
      
      recipesWithUrls.forEach(recipe => {
        recipe.myCollections = myCollections
          .filter(col => col.recipes.some(r => r._id.toString() === recipe._id.toString()))
          .map(col => ({
            _id: col._id,
            title: col.title
          }));
      });
    } else {
      recipesWithUrls.forEach(recipe => {
        recipe.myCollections = [];
      });
    }
    
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
    
    // Add which of my collections contain each recipe
    const myCollections = await RecipeCollection.find({ uid: req.user.uid });
    
    recipesWithUrls.forEach(recipe => {
      recipe.myCollections = myCollections
        .filter(col => col.recipes.some(r => r._id.toString() === recipe._id.toString()))
        .map(col => ({
          _id: col._id,
          title: col.title
        }));
    });
    
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
    
    // Find which of MY collections contain this recipe
    if (req.user) {
      const myCollections = await RecipeCollection.find({
        uid: req.user.uid,
        'recipes._id': req.params.id
      }).select('_id title');
      
      recipeWithUrl.myCollections = myCollections.map(col => ({
        _id: col._id,
        title: col.title
      }));
    } else {
      recipeWithUrl.myCollections = [];
    }
    
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
      ingredients, comments, recipeCollectionID, myComment
    } = req.body;

    const updateData = {};
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
    if (numServings !== undefined) updateData.numServings = numServings;
    if (sourceName !== undefined) updateData.sourceName = sourceName;
    if (timePrepared !== undefined) updateData.timePrepared = timePrepared;
    if (rating !== undefined) updateData.rating = Number(rating);
    if (likes !== undefined) updateData.likes = Number(likes);
    if (cuisine !== undefined) updateData.cuisine = cuisine;
    if (difficulty !== undefined) updateData.difficulty = Number(difficulty);
    if (nutrition !== undefined) updateData.nutrition = nutrition;
    if (myComment !== undefined) updateData.myComment = myComment;
    
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

    // Handle collection updates (only MY collections)
    let parseRecipeCollectionID = [];
    if (recipeCollectionID !== undefined) {
      try {
        parseRecipeCollectionID = typeof recipeCollectionID === 'string' ? JSON.parse(recipeCollectionID) : recipeCollectionID || [];
      } catch (e) {
        parseRecipeCollectionID = [];
      }

      // Find which of MY collections currently have this recipe
      const currentCollections = await RecipeCollection.find({
        uid: req.user.uid,
        'recipes._id': req.params.id
      });
      const currentCollectionIDs = currentCollections.map(col => col._id.toString());
      
      // Collections to remove from
      const collectionsToRemoveFrom = currentCollectionIDs.filter(
        id => !parseRecipeCollectionID.includes(id)
      );
      
      if (collectionsToRemoveFrom.length > 0) {
        await Promise.all(
          collectionsToRemoveFrom.map(async (collectionId) => {
            await RecipeCollection.findOneAndUpdate(
              { _id: collectionId, uid: req.user.uid },
              { $pull: { recipes: { _id: req.params.id } } }
            );
          })
        );
      }

      // Collections to add to
      const collectionsToAddTo = parseRecipeCollectionID.filter(
        id => !currentCollectionIDs.includes(id)
      );
      
      if (collectionsToAddTo.length > 0) {
        const recipePreview = {
          _id: updatedRecipe._id,
          title: updatedRecipe.title,
          imageKey: updatedRecipe.imageKey,
          cuisine: updatedRecipe.cuisine,
          difficulty: updatedRecipe.difficulty,
          timePrepared: updatedRecipe.timePrepared,
          rating: updatedRecipe.rating,
          likes: updatedRecipe.likes,
          uid: updatedRecipe.uid,
          authorName: updatedRecipe.authorName,
          myComment: updateRecipe.myComment
        };

        await Promise.all(
          collectionsToAddTo.map(async (collectionId) => {
            await RecipeCollection.findOneAndUpdate(
              { _id: collectionId, uid: req.user.uid },
              { $addToSet: { recipes: recipePreview } }
            );
          })
        );
      }

      // Collections that still have the recipe - update their preview
      const collectionsToUpdate = parseRecipeCollectionID.filter(
        id => currentCollectionIDs.includes(id)
      );
      
      if (collectionsToUpdate.length > 0) {
        const recipePreview = {
          _id: updatedRecipe._id,
          title: updatedRecipe.title,
          imageKey: updatedRecipe.imageKey,
          cuisine: updatedRecipe.cuisine,
          difficulty: updatedRecipe.difficulty,
          timePrepared: updatedRecipe.timePrepared,
          rating: updatedRecipe.rating,
          likes: updatedRecipe.likes,
          uid: updatedRecipe.uid,
          authorName: updatedRecipe.authorName,
          myComment: updateRecipe.myComment
        };

        await Promise.all(
          collectionsToUpdate.map(async (collectionId) => {
            await RecipeCollection.findOneAndUpdate(
              { _id: collectionId, uid: req.user.uid },
              { $pull: { recipes: { _id: req.params.id } } }
            );
            await RecipeCollection.findOneAndUpdate(
              { _id: collectionId, uid: req.user.uid },
              { $addToSet: { recipes: recipePreview } }
            );
          })
        );
      }
    }

    // Add myCollections info
    const myCollections = await RecipeCollection.find({
      uid: req.user.uid,
      'recipes._id': req.params.id
    }).select('_id title');
    
    recipeWithUrl.myCollections = myCollections.map(col => ({
      _id: col._id,
      title: col.title
    }));

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

    // Remove recipe from ALL collections (including other users' collections)
    // This is necessary because other users might have added this public recipe to their collections
    await RecipeCollection.updateMany(
      { 'recipes._id': req.params.id },
      { $pull: { recipes: { _id: req.params.id } } }
    );
    
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

//Add any public recipe to my collection
export async function addRecipeToCollection(req, res) {
  try {

    const { recipeId, collectionId } = req.body;
    // Verify the collection belongs to me
    const collection = await RecipeCollection.findOne({
      _id: collectionId,
      uid: req.user.uid
    });
    
    if (!collection) {
      return res.status(404).json({ message: "Collection not found or unauthorized" });
    }
    
    // Verify the recipe exists and is either public or owned by me
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    
    if (!recipe.isPublic && recipe.uid !== req.user.uid) {
      return res.status(403).json({ message: "Cannot add private recipe to collection" });
    }
    
    // Create recipe preview with ORIGINAL owner's info
    const recipePreview = {
      _id: recipe._id,
      title: recipe.title,
      imageKey: recipe.imageKey,
      cuisine: recipe.cuisine,
      difficulty: recipe.difficulty,
      timePrepared: recipe.timePrepared,
      rating: recipe.rating,
      likes: recipe.likes,
      uid: recipe.uid, 
      authorName: recipe.authorName,
      myComment: recipe.myComment
    };
    
    // Update ONLY my collection, not the recipe
    const updatedCollection = await RecipeCollection.findByIdAndUpdate(
      collectionId,
      { $addToSet: { recipes: recipePreview } },
      { new: true }
    );
    
    res.status(200).json({ 
      message: "Recipe added to collection successfully",
      collection: updatedCollection
    });
  } catch (error) {
    console.error("Error in addRecipeToCollection controller", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

//Remove recipe from MY collection
export async function removeRecipeFromCollection(req, res) {
  try {
    const { recipeId, collectionId } = req.body;
    
    // Verify the collection belongs to me
    const collection = await RecipeCollection.findOne({
      _id: collectionId,
      uid: req.user.uid
    });
    
    if (!collection) {
      return res.status(404).json({ message: "Collection not found or unauthorized" });
    }
    
    // Remove recipe from my collection
    const updatedCollection = await RecipeCollection.findByIdAndUpdate(
      collectionId,
      { $pull: { recipes: { _id: recipeId } } },
      { new: true }
    );
    
    res.status(200).json({ 
      message: "Recipe removed from collection successfully",
      collection: updatedCollection
    });
  } catch (error) {
    console.error("Error in removeRecipeFromCollection controller", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
export const searchRecipesByText = async (req, res) => {
  try {
    const { q, cuisine, maxDifficulty, minRating, limit = 20 } = req.query;
    
    // Build query
    const query = {};
    
    // Text search
    if (q) {
      query.$text = { $search: q };
    }
    
    // Additional filters
    if (cuisine) {
      query.cuisine = cuisine;
    }
    
    if (maxDifficulty) {
      query.difficulty = { $lte: parseInt(maxDifficulty) };
    }
    
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }
    
    // Only show public recipes or user's own recipes
    if (req.user) {
      query.$or = [
        { isPublic: true },
        { uid: req.user.uid }
      ];
    } else {
      query.isPublic = true;
    }
    
    // Execute search with relevance scoring
    const recipes = await Recipe.find(
      query,
      q ? { score: { $meta: "textScore" } } : {}
    )
    .sort(q ? { score: { $meta: "textScore" } } : { likes: -1 })
    .limit(parseInt(limit));
    
    // Add presigned URLs
    const recipesWithUrls = await addPresignedUrlsToRecipes(recipes.map(r => r.toObject()));
    
    // Add collection info if user is logged in
    if (req.user) {
      const myCollections = await RecipeCollection.find({ uid: req.user.uid });
      
      recipesWithUrls.forEach(recipe => {
        recipe.myCollections = myCollections
          .filter(col => col.recipes.some(r => r._id.toString() === recipe._id.toString()))
          .map(col => ({
            _id: col._id,
            title: col.title
          }));
      });
    } else {
      recipesWithUrls.forEach(recipe => {
        recipe.myCollections = [];
      });
    }
    
    res.status(200).json({
      recipes: recipesWithUrls,
      count: recipesWithUrls.length
    });
  } catch (error) {
    console.error("Error in searchRecipesByText controller", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
