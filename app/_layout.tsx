// _layout.tsx is the root layout file for the Expo Router app. 
// Basically, it wraps the entire app with necessary providers (like Auth and Cart)

import { Stack } from 'expo-router';
import 'react-native-reanimated';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

// Root Layout - Wraps the entire app with necessary providers and defines the main navigation structure
export default function RootLayout() {
  return (
    // 1. AuthProvider must be on the OUTSIDE (because Cart needs useAuth)
    <AuthProvider>
      {/* 2. CartProvider must be inside AuthProvider */}
      <CartProvider>
        {/* 3. The Stack (your screens) must be inside both */}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="product/[id]" />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}