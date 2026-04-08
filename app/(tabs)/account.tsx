// account.tsx is the Account/Profile screen for the user

// Importing necessary modules and components
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Header from '../../components/header';
import { useAuth } from '../../context/AuthContext';

//Displays account information if logged in, otherwise prompts to log in or sign up
export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  if (user) {
    return (
      <View style={styles.container}>
        <Header title="Your Account" />
        <View style={styles.content}>
          <Text style={styles.title}>Welcome, {user.first_name}!</Text>
          <View style={styles.infoBox}>
            <Text style={styles.label}>Email: {user.email}</Text>
            <Text style={styles.label}>Phone: {user.phone || 'Not provided'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // If not logged in, show login/signup options
  return (
    <View style={styles.container}>
      <Header title="Your Account" />
      <View style={styles.content}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>Log in to manage your orders and profile.</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
          <Text style={styles.btnText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signupBtn} onPress={() => router.push('/signup')}>
          <Text style={styles.signupBtnText}>Create an Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles for the Account screen
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  infoBox: { backgroundColor: '#f9f9f9', padding: 20, borderRadius: 10, marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 5 },
  loginBtn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  signupBtn: { borderWidth: 1, borderColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  signupBtnText: { color: '#007AFF', fontWeight: 'bold' },
  logoutBtn: { marginTop: 50, padding: 15, alignItems: 'center', backgroundColor: 'red', borderRadius: 8 },
  logoutText: { color: '#fff', fontWeight: 'bold' },
});