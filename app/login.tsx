// login.tsx is the screen for users.

// Importing necessary modules and components
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

// LoginScreen component that handles user login functionality
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  // Handles the login process, including form validation and error handling
  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Error", "Please fill in all fields");
    }

    // Attempt to log in and navigate to home on success, or show error on failure
    try {
      await login({ email, password });
      router.replace('/'); // Go to home after login
    } catch (err: any) {
      // Backend returns 401 for incorrect password
      Alert.alert("Login Failed", err.message || "Invalid email or password");
    }
  };

  // Render the login form with email and password inputs, and a login button
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <TextInput 
        placeholder="Email" 
        style={styles.input} 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none"
      />
      <TextInput 
        placeholder="Password" 
        style={styles.input} 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('../signup')}>
        <Text style={styles.link}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles for the LoginScreen component
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { marginTop: 20, color: '#007AFF', textAlign: 'center' }
});