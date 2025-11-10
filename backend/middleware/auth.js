import admin from "firebase-admin";
import dotenv from 'dotenv';
dotenv.config();
// Initialize Firebase Admin SDK once with environment variables
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
  })
});

const auth = admin.auth();

// Middleware to verify Firebase token
export async function verifyFirebaseToken(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify token with Firebase Admin
    const decodedToken = await auth.verifyIdToken(token);
    
    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name
    };
    
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}


export const optionalFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // No token? That's okay, continue as guest
    if (!authHeader) {
      req.user = null;
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    // Try to verify token
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name || decodedToken.email
    };
    
    next();
  } catch (error) {
    // Token is invalid? Still continue as guest (don't reject)
    req.user = null;
    next();
  }
};

