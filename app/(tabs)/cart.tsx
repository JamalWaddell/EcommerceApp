// CartScreen.tsx for displaying items in the user's cart. Also checkout is possible!

// Importing necessary modules and components
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiFetch } from '../../api-to-front/client';
import Header from '../../components/header';
import { useCart } from '../../context/CartContext';


// CartScreen component  that actually displays items in the cart and allow checkout
export default function CartScreen() {
  const { items, updateQuantity, removeItem, clear } = useCart();
  const router = useRouter();

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

  // Show loading indicator while fetching product details
  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  // Calculate total price of items in the cart
  const total = items.reduce((sum, item) => {
    const product = products.find(p => p._id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  // Handle checkout process - create order and clear cart
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
      Alert.alert("Checkout Failed", "Please log in first.");
    }
  };

  // If cart is empty, show message
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

// Styles for the Cart screen
const styles = StyleSheet.create({
  item: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  row: { flexDirection: 'row', alignItems: 'center' },
  img: { width: 60, height: 60, resizeMode: 'contain', borderRadius: 5, backgroundColor: '#f0f0f0' },
  name: { fontWeight: 'bold', fontSize: 16 },
  price: { fontSize: 14, color: 'green', marginTop: 5 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  qtyBtn: { fontSize: 24, paddingHorizontal: 15, backgroundColor: '#eee', borderRadius: 5 },
  qtyText: { fontSize: 18, marginHorizontal: 15 },
  id: { marginTop: 10, fontSize: 10, color: '#888' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  total: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  checkoutBtn: { backgroundColor: 'green', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
});