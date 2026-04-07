import { Stack } from 'expo-router';
import 'react-native-reanimated';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

export default function RootLayout() {
  return (
    // 1. AuthProvider must be on the OUTSIDE (because Cart needs useAuth)
    <AuthProvider>
      {/* 2. CartProvider must be inside AuthProvider */}
      <CartProvider>
        {/* 3. The Stack (your screens) must be inside both */}
        <Stack screenOptions={{ headerShown: false }}>
          {/* This automatically finds your index.tsx, cart.tsx, etc. */}
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="account" />
          <Stack.Screen name="product/[id]" />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}