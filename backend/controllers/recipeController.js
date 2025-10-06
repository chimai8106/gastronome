//controller for recipe search

import fetch from 'node-fetch';
import Recipe from '../models/Recipe.js';
//search recipe based on ingredients
export const searchRecipes = async (req, res) => {
  const { ingredients, number, ranking, ignorePantry, uid } = req.body;
  if (uid===null){
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

export const createRecipe= async (req, res)=> {
  try{
    const {title, instruction} = req.body;
    const recipe = new Recipe({
      ...req.body,
      uid: req.user.uid
    });
    const newRecipe = await recipe.save()
    res.status(201).json(newRecipe);
  }
  catch(error){
    console.error("Error in createRecipe controller", error);
    res.status(500).json({ message: "Internal server error" });
  }

}
//get all public recipe
export async function getAllRecipe(_, res) {
  try {
    const recipe = await Recipe.find({ isPublic: true }).sort({ likes : -1 }); // -1 will sort in desc. order (newest first)
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
    if (!recipe.isPublic && recipe.uid !== req.user.uid) {
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
    const { title, instruction } = req.body;
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      { title, instruction, uid: req.user.uid },      
      {
        new: true,
      },
    );

    if (!updatedRecipe) return res.status(404).json({ message: "Recipe not found" });

    res.status(200).json(updatedRecipe);
  } catch (error) {
    console.error("Error in updateRecipe controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

//delete my recipe
export async function deleteRecipe(req, res) {
  try {
    console.log(req.params.id)
    const deletedRecipe = await Recipe.findOneAndDelete({
      _id: req.params.id,
      uid: req.user.uid,
    });
    if (!deletedRecipe) return res.status(404).json({ message: "Recipe not found" });
    res.status(200).json({ message: "Recipe deleted successfully!" });
  } catch (error) {
    console.error("Error in deleteRecipe controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

