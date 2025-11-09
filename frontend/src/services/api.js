import { auth } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.MODE === "development" ? 'http://localhost:5001/api' : "/api"
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
  const user = await waitForAuth();
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

  // Check if body is FormData 
  // if it is, don't set Content-Type
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  // Only add Content-Type if not FormData
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  /*
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
    */
  return response.json();
}

//Public fetch
export async function publicFetch(endpoint, options = {}) {
  // Check if body is FormData
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    ...options.headers,
  };

  // Only add Content-Type if not FormData
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  /*
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
    */

  return response.json();
}
// Optional authenticated fetch - sends token if available, but doesn't require it
export async function optionalAuthFetch(endpoint, options = {}) {
  const token = await getAuthToken(); // This returns null if not logged in  
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...options.headers,
  };
  
  // Add token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Only add Content-Type if not FormData
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  /*
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
    */
  
  return response.json();
}