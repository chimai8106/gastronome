import { auth } from '../firebase/firebase';
const BASE_URL = import.meta.env.MODE === "development"? 'http://localhost:5001/api' : "/api"

const API_BASE_URL = BASE_URL;

// Wait for auth to be ready
function waitForAuth() {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
    } else {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user);
      });
    }
  });
}

//Get the current user's token
export async function getAuthToken() {
  const user = await waitForAuth(); // Wait for auth to be ready
  if (!user) return null;
  
  const token = await user.getIdToken();
  return token;
}

//Authenticated fetch
export async function authenticatedFetch(endpoint, options = {}) {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

//Public fetch 
export async function publicFetch(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}