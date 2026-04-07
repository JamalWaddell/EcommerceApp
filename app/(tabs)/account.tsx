import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext'; // Path to your AuthContext

export default function ProfileScreen() {
  const { user, logout } = useAuth(); // Assume your context provides user and logout
  const router = useRouter();

  // STATE 1: User is Logged In
  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome, {user.first_name}!</Text>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Email: {user.email}</Text>
          <Text style={styles.label}>Phone: {user.phone || 'Not provided'}</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // STATE 2: User is NOT Logged In
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
      <Text style={styles.subtitle}>Log in to manage your orders and profile.</Text>
      
      <TouchableOpacity 
        style={styles.loginBtn} 
        onPress={() => router.push('/login')}
      >
        <Text style={styles.btnText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.signupBtn} 
        onPress={() => router.push('/signup')}
      >
        <Text style={styles.signupBtnText}>Create an Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  infoBox: { backgroundColor: '#f9f9f9', padding: 20, borderRadius: 10, marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 5 },
  loginBtn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  signupBtn: { borderWidth: 1, borderColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  signupBtnText: { color: '#007AFF', fontWeight: 'bold' },
  logoutBtn: { marginTop: 50, padding: 15, alignItems: 'center' },
  logoutText: { color: 'red', fontWeight: 'bold' }
});