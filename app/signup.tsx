// signup.tsx is the screen for users to create an account.

// Importing necessary modules and components
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

// SignupScreen component that handles user registration functionality
export default function SignupScreen() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: '', confirmPassword: ''
  });
  const { signup } = useAuth();
  const router = useRouter();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handles the signup process, including form validation and error handling
  const handleSignup = async () => {
    const { first_name, last_name, email, phone, password, confirmPassword } = form;

    // 1. Check for empty fields
    if (!first_name || !last_name || !email || !password) {
      return Alert.alert("Error", "Please fill in all required fields");
    }

    // 2. Validate Email Format
    if (!validateEmail(email)) {
      return Alert.alert("Error", "Please enter a valid email address");
    }

    // 3. Match Passwords
    if (password !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    try {
      await signup({ first_name, last_name, email, password, phone });
      Alert.alert("Success", "Account created!");
      router.replace('/');
    } catch (err: any) {
      // Backend returns 409 if email already exists
      Alert.alert("Signup Failed", err.message || "An error occurred");
    }
  };

  // Render the signup form with inputs for user details and a signup button
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <TextInput placeholder="First Name *" style={styles.input} 
        onChangeText={(val) => setForm({...form, first_name: val})} />
      
      <TextInput placeholder="Last Name *" style={styles.input} 
        onChangeText={(val) => setForm({...form, last_name: val})} />
      
      <TextInput placeholder="Email *" style={styles.input} autoCapitalize="none"
        onChangeText={(val) => setForm({...form, email: val})} />
      
      <TextInput placeholder="Phone" style={styles.input} keyboardType="phone-pad"
        onChangeText={(val) => setForm({...form, phone: val})} />
      
      <TextInput placeholder="Password *" style={styles.input} secureTextEntry
        onChangeText={(val) => setForm({...form, password: val})} />
      
      <TextInput placeholder="Confirm Password *" style={styles.input} secureTextEntry
        onChangeText={(val) => setForm({...form, confirmPassword: val})} />

      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Styles for the SignupScreen component
const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { marginTop: 20, color: '#007AFF', textAlign: 'center', marginBottom: 40 }
});