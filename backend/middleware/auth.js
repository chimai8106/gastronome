import admin from "firebase-admin";
import 'dotenv/config';
console.log('=== DEBUGGING ENV VARS ===');
console.log('PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('PROJECT_ID type:', typeof process.env.FIREBASE_PROJECT_ID);
console.log('PROJECT_ID length:', process.env.FIREBASE_PROJECT_ID?.length);
console.log('CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);
console.log('===========================');



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

export default { verifyFirebaseToken };