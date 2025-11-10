import {S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {v4 as uuid} from "uuid";
import 'dotenv/config';

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET = process.env.BUCKET;

// Upload file and return the S3 key
export const uploadToS3 = async ({file, uid}) => {
    const key = `${uid}/${uuid()}`;
    const command = new PutObjectCommand({ 
        Bucket: BUCKET, 
        Key: key, 
        Body: file.buffer, 
        ContentType: file.mimetype,
    });
    
    try {
        await s3.send(command);
        return {key};
    } catch(error) {
        console.log(error);
        return {error};
    }
};

// Generate presigned URL from S3 key 
export const getImagePresignedUrl = async (key) => {  
  try {
    if (!key) return null;
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });  
    return await getSignedUrl(s3, command, { expiresIn: 15000 });  
  } catch (error) {
    console.log('Error generating presigned URL:', error);
    return null;
  }
};

// Delete image 
export const deleteImage = async (key) => {
    if (!key) {
        console.log('No key provided for deletion');
        return { error: 'No key provided' };
    }
    
    const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
    
    try {
        await s3.send(command);
        console.log('Successfully deleted image with key:', key);
        return { key };
    } catch(error) {
        console.error('Error deleting image from S3:', error);
        return { error };
    }
}

// Helper function: Add presigned URL to a single recipe object
export const addPresignedUrlToRecipe = async (recipe) => {
    if (!recipe) return recipe;
    
    // Generate presigned URL from imageKey
    if (recipe.imageKey) {
        recipe.image = await getImagePresignedUrl(recipe.imageKey);
    }
    
    return recipe;
};

// Helper function: Add presigned URLs to array of recipes
export const addPresignedUrlsToRecipes = async (recipes) => {
    if (!recipes || recipes.length === 0) return recipes;
    return Promise.all(recipes.map(recipe => addPresignedUrlToRecipe(recipe)));
};