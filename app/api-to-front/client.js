import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// 1. Fix the URL for Android Emulators
// 10.0.2.2 is the special alias to your computer's localhost from the Android emulator
const API_BASE = Platform.OS === 'android' 
  ? 'http://10.0.2.2:5000' 
  : 'http://localhost:5000';

// 2. Storage is ASYNC in mobile. 
// These functions must now be 'async'
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
  // Wait for the token to be retrieved from storage
  const token = await getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Handle network timeouts/errors which are common on mobile
  try {
    const res = await fetch(`${API_BASE}${path}`, {
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
    // Mobile specific: catch "Network request failed" (usually means server is down or IP is wrong)
    console.error("API Fetch Error:", err);
    throw err;
  }
}