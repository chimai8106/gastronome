import fetch from 'node-fetch';
import RecipeCollection from '../models/RecipeCollection.js';
import User from "../models/User.js";
import { getImagePresignedUrl } from '../db/s3.mjs';
import validationModule from '../utils/validation.js';
import errorModule from '../utils/errors.js';

const { validateRequired, validateObjectId } = validationModule;
const { ValidationError, NotFoundError, AuthorizationError } = errorModule;

// Helper: Add presigned URLs to recipes in a collection
const addPresignedUrlsToCollection = async (collection) => {
  if (!collection) return collection;
  
  // Convert to plain object if it's a mongoose document
  const collectionObj = collection.toObject ? collection.toObject() : collection;
  
  // Generate presigned URLs for each recipe in the collection
  if (collectionObj.recipes && collectionObj.recipes.length > 0) {
    collectionObj.recipes = await Promise.all(
      collectionObj.recipes.map(async (recipe) => {
        if (recipe.imageKey) {
          recipe.image = await getImagePresignedUrl(recipe.imageKey);
        }
        return recipe;
      })
    );
  }
  
  return collectionObj;
};

// Helper: Add presigned URLs to multiple collections
const addPresignedUrlsToCollections = async (collections) => {
  if (!collections || collections.length === 0) return collections;
  return Promise.all(collections.map(col => addPresignedUrlsToCollection(col)));
};

//create a new recipeCollection
export const createRecipeCollection = async (req, res, next) => {
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
    // Validate required fields
    validateRequired(['title'], req.body);

    const newRecipeCollection = await recipeCollection.save();
    res.status(201).json(newRecipeCollection);
  } catch (error) {
    next(error);
  }
}

//get all public recipeCollection
export async function getAllRecipeCollection(_, res, next) {
  try {
    const recipeCollections = await RecipeCollection.find({ isPublic: true }).sort({ likes: -1 });
    
    // Generate presigned URLs for recipe images in each collection
    const collectionsWithUrls = await addPresignedUrlsToCollections(recipeCollections);
    
    res.status(200).json(collectionsWithUrls);
  } catch (error) {
    next(error);
  }
}

//get all my recipeCollection
export async function getAllMyRecipeCollection(req, res, next) {
  try {
    const recipeCollections = await RecipeCollection.find({ uid: req.user.uid }).sort({ likes: -1 });
    
    // Generate presigned URLs for recipe images in each collection
    const collectionsWithUrls = await addPresignedUrlsToCollections(recipeCollections);
    
    res.status(200).json(collectionsWithUrls);
  } catch (error) {
    next(error);
  }
}

//get a recipeCollection by its ID
export async function getRecipeCollectionById(req, res, next) {
  try {
    const recipeCollection = await RecipeCollection.findById(req.params.id);
    if (!recipeCollection) return res.status(404).json({ message: "Recipe Collection not found!" });
    
    // Check if user is authenticated before checking uid
    if (!recipeCollection.isPublic && (!req.user || recipeCollection.uid !== req.user.uid)) {
      return res.status(403).json({ message: "You are not allowed to view this recipeCollection" });
    }
    
    // Generate presigned URLs for recipe images
    const collectionWithUrls = await addPresignedUrlsToCollection(recipeCollection);
    
    res.json(collectionWithUrls);
  } catch (error) {
    next(error);
  }
}

//update my recipeCollection
export async function updateRecipeCollection(req, res, next) {
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

    // Generate presigned URLs before sending
    const collectionWithUrls = await addPresignedUrlsToCollection(updatedRecipeCollection);

    res.status(200).json(collectionWithUrls);
  } catch (error) {
    next(error);
  }
}

//delete my recipeCollection
export async function deleteRecipeCollection(req, res, next) {
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
    next(error);
  }
}
export const searchCollectionsByText = async (req, res, next) => {
  try {
    const { q, limit = 20 } = req.query;
    
    const query = {};
    
    if (q) {
      query.$text = { $search: q };
    }
    
    // Only show public collections or user's own collections
    if (req.user) {
      query.$or = [
        { isPublic: true },
        { uid: req.user.uid }
      ];
    } else {
      query.isPublic = true;
    }
    
    const collections = await RecipeCollection.find(
      query,
      q ? { score: { $meta: "textScore" } } : {}
    )
    .sort(q ? { score: { $meta: "textScore" } } : { createdAt: -1 })
    .limit(parseInt(limit));
    
    // Add presigned URLs
    const collectionsWithUrls = await addPresignedUrlsToCollections(collections);
    
    res.status(200).json({
      collections: collectionsWithUrls,
      count: collectionsWithUrls.length
    });
  } catch (error) {
   next(error);
  }
};

