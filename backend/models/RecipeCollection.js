import mongoose from "mongoose";

const recipeCollectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    uid: {
      type: String,
      required: true,
    },
    authorName:{
      type: String,
      required: true
    },
    //Store preview data for fast rendering
    recipes: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Recipe",
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        imageKey: {
          type: String,
          default: null,
        },
        cuisine: {
          type: String,
          default: "",
        },
        difficulty: {
          type: Number,
          default: 0,
        },
        timePrepared: {
          type: String,
          default: "",
        },
        rating: {
          type: Number,
          default: 0,
        },
        like: {
          type: Number,
          default: 0
        },
        myComment: {
          type: String,
          default: "",
        }
      }
    ],
  },
  { timestamps: true }
);

recipeCollectionSchema.index({
  title: 'text',
  description: 'text',
  authorName: 'text'
});

const RecipeCollection = mongoose.model("RecipeCollection", recipeCollectionSchema);

export default RecipeCollection;