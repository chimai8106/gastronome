import { auth } from '../firebase/firebase';

const API_BASE_URL = 'http://localhost:5001/api';

//Get the current user's token
export async function getAuthToken() {
  const user = auth.currentUser;
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