import mongoose from "mongoose";

//1. create a schema
//2. model based off of that schema

const recipeSchema = new mongoose.Schema({
    uid:{
        type: String,
        required: true
    },
    imageKey:{
        type: String
    },
    sourceName:{
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
        type: String
    },
    timePrepared:{
        type: String
    },
    rating:{
        type: Number,
    }, 
    likes:{
        type: Number
    },
    likedBy: 
    [{ type: String}],

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
    },
    recipeCollectionID:[{type: String}],
    recipeCollectionName:[{type: String}],
    myComment:{
        type: String
    }
},
{ timestamps : true});
const Recipe = mongoose.model("Recipe", recipeSchema)

export default Recipe;