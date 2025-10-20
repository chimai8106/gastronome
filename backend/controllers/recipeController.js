import fetch from 'node-fetch';
import Recipe from '../models/Recipe.js';
import RecipeCollection from '../models/RecipeCollection.js';

//search recipe based on ingredients
export const searchRecipes = async (req, res) => {
  const { ingredients, number, ranking, ignorePantry, uid } = req.body;
  if (uid === null) {
    res.status(401).json({ message: "You need to log in to search recipe" });
  }
  const apiKey = process.env.SPOONACULAR_API_KEY;
  //1. Call Spoonacular API
  const basicResponse = await fetch(
    `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients}&number=${number}&ranking=${ranking}&ignorePantry=${ignorePantry}&apiKey=${apiKey}`
  );
  const basicData = await basicResponse.json();

  //2. Get detailed recipe info  
  const detailedData = await Promise.all(
    basicData.map(async (recipe) => {
      const detailResponse = await fetch(
        `https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${apiKey}`
      );
      return detailResponse.json();
    })
  );

  //3. Merge the data
  const mergedRecipes = detailedData.map((detail) => {
    const match = basicData.find((r) => r.id === detail.id);
    return {
      ...detail,
      usedIngredients: match.usedIngredients,
      missedIngredients: match.missedIngredients,
    };
  });

  //4. Send back to frontend
  res.json(mergedRecipes);
};

//create a new recipe
export const createRecipe = async (req, res) => {
  try {

    // Extract and parse fields from FormData
    const {
      title,
      instruction,
      isPublic,
      numServings,
      timePrepared,
      rating,
      likes,
      cuisine,
      difficulty,
      nutrition,
      ingredients,
      comments,
      recipeCollectionID,
      recipeCollectionName
    } = req.body;

    // Parse JSON strings back to arrays (with safety checks)
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
      ingredients: parsedIngredients,
      comments: parsedComments,
      isPublic: isPublic === 'true' || isPublic === true,
      numServings: Number(numServings),
      timePrepared: Number(timePrepared),
      rating: Number(rating),
      likes: Number(likes),
      cuisine,
      difficulty: Number(difficulty),
      nutrition,
      uid: req.user.uid,
      authorName: req.user.displayName,
      image: req.file ? req.file.path : null,
      recipeCollectionID: parseRecipeCollectionID,
      recipeCollectionName: parseRecipeCollectionName
    });

    const newRecipe = await recipe.save();

    // Add recipe preview data to all selected collections (HYBRID APPROACH)
    if (parseRecipeCollectionID.length > 0) {
      const recipePreview = {
        _id: newRecipe._id,
        title: newRecipe.title,
        image: newRecipe.image,
        cuisine: newRecipe.cuisine,
        difficulty: newRecipe.difficulty,
        timePrepared: newRecipe.timePrepared,
        rating: newRecipe.rating
      };

      await Promise.all(
        parseRecipeCollectionID.map(async (collectionId) => {
          await RecipeCollection.findByIdAndUpdate(
            collectionId,
            { $addToSet: { recipes: recipePreview } }, // $addToSet prevents duplicates
            { new: true }
          );
        })
      );
    }

    res.status(201).json(newRecipe);
  } catch (error) {
    console.error("Error in createRecipe controller", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

//get all public recipe
export async function getAllRecipe(_, res) {
  try {
    const recipe = await Recipe.find({ isPublic: true }).sort({ likes: -1 });
    res.status(200).json(recipe);
  } catch (error) {
    console.error("Error in getAllRecipe controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

//get all my recipe
export async function getAllMyRecipe(req, res) {
  try {
    const recipes = await Recipe.find({ uid: req.user.uid }).sort({ likes: -1 });
    res.status(200).json(recipes);
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
    
    // Check if user is authenticated before checking uid
    if (!recipe.isPublic && (!req.user || recipe.uid !== req.user.uid)) {
      return res.status(403).json({ message: "You are not allowed to view this recipe" });
    }
    
    res.json(recipe);
  } catch (error) {
    console.error("Error in getRecipeById controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

//update my recipe
export async function updateRecipe(req, res) {
  try {

    // First check if the recipe belongs to the user
    const existingRecipe = await Recipe.findOne({
      _id: req.params.id,
      uid: req.user.uid
    });

    if (!existingRecipe) {
      return res.status(404).json({ message: "Recipe not found or you don't have permission" });
    }

    // Extract and parse fields from FormData
    const {
      title,
      instruction,
      isPublic,
      numServings,
      timePrepared,
      rating,
      likes,
      cuisine,
      difficulty,
      nutrition,
      ingredients,
      comments,
      recipeCollectionID,
      recipeCollectionName
    } = req.body;

    const updateData = {
      uid: req.user.uid,
    };

    if (title) updateData.title = title;
    if (instruction) updateData.instruction = instruction;
    if (isPublic !== undefined) updateData.isPublic = isPublic === 'true' || isPublic === true;
    if (numServings) updateData.numServings = Number(numServings);
    if (timePrepared) updateData.timePrepared = Number(timePrepared);
    if (rating) updateData.rating = Number(rating);
    if (likes) updateData.likes = Number(likes);
    if (cuisine) updateData.cuisine = cuisine;
    if (difficulty) updateData.difficulty = Number(difficulty);
    if (nutrition) updateData.nutrition = nutrition;
    
    // Handle ingredients with safety check
    if (ingredients) {
      try {
        updateData.ingredients = typeof ingredients === 'string' ? JSON.parse(ingredients) : ingredients;
      } catch (e) {
        updateData.ingredients = [];
      }
    }
    
    // Handle comments with safety check
    if (comments) {
      try {
        updateData.comments = typeof comments === 'string' ? JSON.parse(comments) : comments;
      } catch (e) {
        updateData.comments = [];
      }
    }

    let parseRecipeCollectionID = [];
    let parseRecipeCollectionName = [];

    // Handle recipeCollectionID with safety check
    if (recipeCollectionID !== undefined) {
      try {
        parseRecipeCollectionID = typeof recipeCollectionID === 'string' ? JSON.parse(recipeCollectionID) : recipeCollectionID || [];
        updateData.recipeCollectionID = parseRecipeCollectionID;
      } catch (e) {
        parseRecipeCollectionID = [];
        updateData.recipeCollectionID = [];
      }
    }

    // Handle recipeCollectionName with safety check
    if (recipeCollectionName !== undefined) {
      try {
        parseRecipeCollectionName = typeof recipeCollectionName === 'string' ? JSON.parse(recipeCollectionName) : recipeCollectionName || [];
        updateData.recipeCollectionName = parseRecipeCollectionName;
      } catch (e) {
        parseRecipeCollectionName = [];
        updateData.recipeCollectionName = [];
      }
    }

    if (req.file) updateData.image = req.file.path;

    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // Update collections: Remove from old collections and add to new ones (HYBRID APPROACH)
    if (recipeCollectionID !== undefined) {
      const oldCollectionIDs = existingRecipe.recipeCollectionID || [];
      
      // Remove recipe from old collections that are no longer selected
      const collectionsToRemoveFrom = oldCollectionIDs.filter(id => !parseRecipeCollectionID.includes(id));
      
      await Promise.all(
        collectionsToRemoveFrom.map(async (collectionId) => {
          await RecipeCollection.findByIdAndUpdate(
            collectionId,
            { $pull: { recipes: { _id: req.params.id } } } // Remove by _id in subdocument
          );
        })
      );

      // Add recipe to new collections with preview data
      const collectionsToAddTo = parseRecipeCollectionID.filter(id => !oldCollectionIDs.includes(id));
      
      if (collectionsToAddTo.length > 0) {
        const recipePreview = {
          _id: updatedRecipe._id,
          title: updatedRecipe.title,
          image: updatedRecipe.image,
          cuisine: updatedRecipe.cuisine,
          difficulty: updatedRecipe.difficulty,
          timePrepared: updatedRecipe.timePrepared,
          rating: updatedRecipe.rating
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

      // Update preview data in existing collections (in case title/image/etc changed)
      const collectionsToUpdate = parseRecipeCollectionID.filter(id => oldCollectionIDs.includes(id));
      
      if (collectionsToUpdate.length > 0) {
        const recipePreview = {
          _id: updatedRecipe._id,
          title: updatedRecipe.title,
          image: updatedRecipe.image,
          cuisine: updatedRecipe.cuisine,
          difficulty: updatedRecipe.difficulty,
          timePrepared: updatedRecipe.timePrepared,
          rating: updatedRecipe.rating
        };

        await Promise.all(
          collectionsToUpdate.map(async (collectionId) => {
            // Remove old version and add updated version
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

    res.status(200).json(updatedRecipe);
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

    // Remove recipe from all collections before deleting (HYBRID APPROACH)
    if (recipe.recipeCollectionID && recipe.recipeCollectionID.length > 0) {
      await Promise.all(
        recipe.recipeCollectionID.map(async (collectionId) => {
          await RecipeCollection.findByIdAndUpdate(
            collectionId,
            { $pull: { recipes: { _id: req.params.id } } } // Remove by _id in subdocument
          );
        })
      );
    }

    await Recipe.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: "Recipe deleted successfully!" });
  } catch (error) {
    console.error("Error in deleteRecipe controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}