import mongoose from "mongoose";
const commentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  recipeId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  comment: {type: String, required: true}
});

const Comment = mongoose.model('Comment', commentSchema);