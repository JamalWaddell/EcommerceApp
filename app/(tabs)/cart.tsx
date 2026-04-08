// CartScreen.tsx for displaying items in the user's cart. Also checkout is possible!

// Importing necessary modules and components
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiFetch } from '../../api-to-front/client';
import Header from '../../components/header';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

// CartScreen component  that actually displays items in the cart and allow checkout
export default function CartScreen() {
  const { items, updateQuantity, removeItem, clear } = useCart();
  const router = useRouter();
  
  // ADDED: Get auth status
  const { isLoggedIn, user } = useAuth(); 

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const productDetails = await Promise.all(
          items.map(i => apiFetch(`/api/products/${i.productId}`))
        );
        setProducts(productDetails);
      } catch (e) {
        console.error("Failed to fetch product details", e);
      } finally {
        setLoading(false);
      }
    }

    if (items.length > 0) loadProducts();
    else setLoading(false);
  }, [items]);

  // 1. CHECK: Is User Logged In?
  if (!isLoggedIn) {
    return (
      <View style={styles.centered}>
        <Header title="Your Cart" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={styles.emptyText}>You need to login to access the cart.</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/login')}>
            <Text style={styles.btnText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 2. CHECK: Is Loading Products?
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <Header title="Your Cart" />
        <ActivityIndicator size="large" style={{ flex: 1 }} />
      </View>
    );
  }

  // 3. CHECK: Is Cart Empty?
  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <Header title="Your Cart" />
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No items in cart currently.</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.replace('/')}>
            <Text style={styles.btnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Calculate total price
  const total = items.reduce((sum, item) => {
    const product = products.find(p => p._id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  const handleCheckout = async () => {
    try {
      const data = await apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ items, total }),
      });
      Alert.alert("Success", `Order ${data.orderId} Placed Successfully!`);
      clear();
      router.replace('/');
    } catch (e) {
      Alert.alert("Checkout Failed", "Please try again.");
    }
  };

  // 4. RENDER: Cart Items
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header title="Your Cart" />
      <FlatList
        data={items}
        keyExtractor={item => item.productId}
        renderItem={({ item }) => {
          const product = products.find(p => p._id === item.productId);
          if (!product) return null;

          return (
            <View style={styles.item}>
              <View style={styles.row}>
                <Image 
                  source={{ uri: product.imageUrl || 'https://via.placeholder.com/60' }}
                  style={styles.img}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.name}>{product.name}</Text>
                  <Text style={styles.price}>${product.price.toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.qtyRow}>
                <TouchableOpacity onPress={() => updateQuantity(item.productId, item.quantity - 1)}>
                  <Text style={styles.qtyBtn}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateQuantity(item.productId, item.quantity + 1)}>
                  <Text style={styles.qtyBtn}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeItem(item.productId)} style={{ marginLeft: 20 }}>
                  <Text style={{ color: 'red' }}>Remove</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.id}>ID: {product._id}</Text>
            </View>
          );
        }}
      />
      <View style={styles.footer}>
        <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.btnText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff' 
  },
  emptyText: { 
    fontSize: 18, 
    color: '#888', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  emptyButton: {
    backgroundColor: '#007AFF', 
    padding: 15, 
    borderRadius: 10, 
    width: '80%', 
    alignItems: 'center'
  },
  item: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  row: { flexDirection: 'row', alignItems: 'center' },
  img: { width: 60, height: 60, resizeMode: 'contain', borderRadius: 5, backgroundColor: '#f0f0f0' },
  name: { fontWeight: 'bold', fontSize: 16 },
  price: { fontSize: 14, color: 'green', marginTop: 5 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  qtyBtn: { fontSize: 24, paddingHorizontal: 15, backgroundColor: '#eee', borderRadius: 5 },
  qtyText: { fontSize: 18, marginHorizontal: 15 },
  id: { marginTop: 10, fontSize: 10, color: '#888' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
  total: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  checkoutBtn: { backgroundColor: 'green', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
});