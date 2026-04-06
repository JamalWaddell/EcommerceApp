import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Header from '../../components/header';
import { apiFetch } from '../api-to-front/client';
import { useCart } from '../context/CartContext';

export default function CartScreen() {
  const { items, updateQuantity, removeItem, clear } = useCart();
  const router = useRouter();

  const total = items.reduce((sum, item) => sum + (item.quantity * 1000), 0); // Assuming flat price for demo, or fetch product detail

  const handleCheckout = async () => {
    try {
      // Simulation of checkout
      await apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ items, total: 1500 }) // Example total
      });
      Alert.alert("Success", "Order Placed Successfully!");
      clear();
      router.replace('/');
    } catch (e) {
      Alert.alert("Checkout Failed", "Please log in first.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header title="Your Cart" />
      <FlatList 
        data={items}
        keyExtractor={item => item.productId}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={{fontWeight: 'bold'}}>Product ID: {item.productId}</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity onPress={() => updateQuantity(item.productId, item.quantity - 1)}><Text style={styles.qtyBtn}>-</Text></TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity onPress={() => updateQuantity(item.productId, item.quantity + 1)}><Text style={styles.qtyBtn}>+</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => removeItem(item.productId)} style={{marginLeft: 20}}><Text style={{color: 'red'}}>Remove</Text></TouchableOpacity>
            </View>
          </View>
        )}
      />
      <View style={styles.footer}>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.btnText}>Checkout Simulation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  qtyBtn: { fontSize: 24, paddingHorizontal: 15, backgroundColor: '#eee', borderRadius: 5 },
  qtyText: { fontSize: 18, marginHorizontal: 15 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  checkoutBtn: { backgroundColor: 'green', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});