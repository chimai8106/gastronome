import mongoose from "mongoose";

//1. create a schema
//2. model based off of that schema

const recipeSchema = new mongoose.Schema({
    uid:{
        type: String,
        required: true
    },
    image:{
        type: String
    },
    authorName:{
        type: String,
        required: true
    },
    title:{
        type: String,
        required: true
    },
    ingredients:{
        type: [String],
        required: true

    },
    instruction:{
        type: String,
        required: true
    },
    isPublic:{
        type: Boolean,
        default: true,
        required: true
    },
    numServings:{
        type: Number
    },
    timePrepared:{
        type: Number
    },
    rating:{
        type: Number,
    }, 
    likes:{
        type: Number
    },
    likedBy: 
    [{ type: String, ref: "User", select: false }],

    comments:{
        type: [String]
    },
    cuisine:{
        type: String
    }, 
    difficulty:{
        type: Number
    },
    nutrition:{
        type: String
    }

},
{ timestamps : true});
const Recipe = mongoose.model("Recipe", recipeSchema)

export default Recipe;