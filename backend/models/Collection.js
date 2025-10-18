import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema({
  name: { type: String, required: true },      
  description: String,
  recipes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }], 
  createdBy: { type: String, ref: "User", required: true },
  isDefault: { type: Boolean, default: false }, 
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Collection", collectionSchema);
