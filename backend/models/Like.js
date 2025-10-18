import mongoose from "mongoose";
const likeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  recipeId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

//create a unique compound index
likeSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

const Like = mongoose.model('Like', likeSchema);
