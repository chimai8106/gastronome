import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,  
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  username: {
    type: String,
  },
  recipeCollections: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecipeCollection",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("User", userSchema);
