import fetch from 'node-fetch';
import RecipeCollection from '../models/RecipeCollection.js';
import User from "../models/User.js";

//create a new recipeCollection
export const createRecipeCollection = async (req, res) => {
  try {

    // Extract fields from FormData
    const { title, description, isPublic } = req.body;

    const recipeCollection = new RecipeCollection({
      title,
      description,
      isPublic: isPublic === 'true' || isPublic === true, 
      uid: req.user.uid,
      image: req.file ? req.file.path : null,
      authorName: req.user.displayName
    });

    const newRecipeCollection = await recipeCollection.save();
    res.status(201).json(newRecipeCollection);
  } catch (error) {
    console.error("Error in createRecipeCollection controller", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

//get all public recipeCollection
export async function getAllRecipeCollection(_, res) {
  try {
    const recipeCollections = await RecipeCollection.find({ isPublic: true }).sort({ likes: -1 });
    res.status(200).json(recipeCollections);
  } catch (error) {
    console.error("Error in getAllRecipeCollection controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

//get all my recipeCollection
export async function getAllMyRecipeCollection(req, res) {
  try {
    const recipeCollections = await RecipeCollection.find({ uid: req.user.uid }).sort({ likes: -1 });
    res.status(200).json(recipeCollections);
  } catch (error) {
    console.error("Error in getAllMyRecipeCollection controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

//get a recipeCollection by its ID
export async function getRecipeCollectionById(req, res) {
  try {
    const recipeCollection = await RecipeCollection.findById(req.params.id);
    if (!recipeCollection) return res.status(404).json({ message: "Recipe Collection not found!" });
    
    // Check if user is authenticated before checking uid
    if (!recipeCollection.isPublic && (!req.user || recipeCollection.uid !== req.user.uid)) {
      return res.status(403).json({ message: "You are not allowed to view this recipeCollection" });
    }
    
    res.json(recipeCollection);
  } catch (error) {
    console.error("Error in getRecipeCollectionById controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

//update my recipeCollection
export async function updateRecipeCollection(req, res) {
  try {
    
    // First check if the collection belongs to the user
    const existingCollection = await RecipeCollection.findOne({
      _id: req.params.id,
      uid: req.user.uid
    });

    if (!existingCollection) {
      return res.status(404).json({ message: "Recipe Collection not found or you don't have permission" });
    }

    // Extract and parse fields from FormData
    const { title, description, isPublic } = req.body;
    
    const updateData = {
      uid: req.user.uid,
      title,
      description,
      isPublic,
      authorName: req.user.displayName
    };

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic === 'true' || isPublic === true;
    if (req.file) updateData.image = req.file.path;

    const updatedRecipeCollection = await RecipeCollection.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.status(200).json(updatedRecipeCollection);
  } catch (error) {
    console.error("Error in updateRecipeCollection controller", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

//delete my recipeCollection
export async function deleteRecipeCollection(req, res) {
  try {
    const deletedRecipeCollection = await RecipeCollection.findOneAndDelete({
      _id: req.params.id,
      uid: req.user.uid,
    });
    
    if (!deletedRecipeCollection) {
      return res.status(404).json({ message: "Recipe Collection not found or you don't have permission" });
    }
    
    res.status(200).json({ message: "Recipe Collection deleted successfully!" });
  } catch (error) {
    console.error("Error in deleteRecipeCollection controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}