import AsyncStorage from '@react-native-async-storage/async-storage';

// Use your computer's IP for both. 
// Note: If you use the Android Emulator, 10.0.2.2 also works, 
// but the IP address works for EVERYTHING (Phone, Emulator, Simulator).
const API_BASE = 'http://192.168.0.101:5000'; 

export async function getAuthToken() {
  return await AsyncStorage.getItem('estore_token');
}

export async function setAuthToken(token) {
  if (token) {
    await AsyncStorage.setItem('estore_token', token);
  } else {
    await AsyncStorage.removeItem('estore_token');
  }
}

export async function apiFetch(path, options = {}) {
  const token = await getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    // Log the full URL being fetched for debugging
    console.log(`Fetching: ${API_BASE}${cleanPath}`); 

    const res = await fetch(`${API_BASE}${cleanPath}`, {
      ...options,
      headers,
    });

    const text = await res.text();
    let data;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { error: text };
    }

    if (!res.ok) {
      const message = data?.error || `Request failed: ${res.status}`;
      const error = new Error(message);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.error("API Fetch Error:", err.message);
    throw err;
  }
}