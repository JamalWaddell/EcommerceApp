// header.tsx is the component for the app's header

// Importing necessary modules and components
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCart } from '../context/CartContext';

// Header component that displays the app title and a cart icon with item count badge
export default function Header({ title }: { title: string }) {
  const router = useRouter();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Render the header with title and cart icon, showing item count if there are items in the cart
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={() => router.push('../cart')} style={styles.cartBtn}>
        <Ionicons name="cart-outline" size={28} color="white" />
        {cartCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cartCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

// Styles for the Header component
const styles = StyleSheet.create({
  container: { height: 70, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, backgroundColor: '#0a1f44', borderBottomWidth: 1, borderBottomColor: '#0d2b5e', paddingTop: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  cartBtn: { position: 'relative' },
  badge: { position: 'absolute', right: -6, top: -6, backgroundColor: 'red', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
});