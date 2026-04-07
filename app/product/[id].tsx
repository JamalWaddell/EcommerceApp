import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiFetch } from '../../api-to-front/client';
import Header from '../../components/header';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const { addItem } = useCart();
  const { user, loading: authLoading } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/products/${id}`)
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch Error:", err);
        setLoading(false);
      });
  }, [id]);

  // SAFE INCREMENT (Using ?. to prevent "stock of null" error)
  const increment = () => {
    if (product && quantity < product.stock) {
      setQuantity(prev => prev + 1);
    } else if (product) {
      Alert.alert("Limit Reached", "You cannot add more than the available stock.");
    }
  };

  const decrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    // Check if product actually loaded
    if (!product) return;

    if (!user) {
      Alert.alert("Login Required", "Please log in to add items to your cart.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push('/login') }
      ]);
      return;
    }

    if (product.stock <= 0) {
      Alert.alert("Out of Stock", "Sorry, this item is no longer available.");
      return;
    }

    try {
      await addItem(product._id, quantity);
      Alert.alert("Success", `${quantity} item(s) added!`, [
        { text: "Continue Shopping", style: "cancel" },
        { text: "Go to Cart", onPress: () => router.push('/(tabs)/cart') }
      ]);
    } catch (error) {
      Alert.alert("Error", "Could not add to cart.");
    }
  };

  // 1. Show spinner while loading
  if (loading || authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{marginTop: 10}}>Loading Product...</Text>
      </View>
    );
  }

  // 2. Show error if product failed to load
  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Product not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{color: '#007AFF', marginTop: 20}}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. Now we are 100% sure product is NOT null
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header title="Product Details" />
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{ uri: product.imageUrl }} style={styles.image} />
        
        <View style={styles.info}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.category}>{product.category} | {product.colour}</Text>
          <Text style={styles.price}>${product.price}</Text>
          <Text style={styles.desc}>{product.description}</Text>
          
          <Text style={styles.stockStatus}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
          </Text>

          {product.stock > 0 && (
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantity:</Text>
              <View style={styles.picker}>
                <TouchableOpacity onPress={decrement} style={styles.pickerBtn}>
                  <Text style={styles.pickerText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityNumber}>{quantity}</Text>
                <TouchableOpacity onPress={increment} style={styles.pickerBtn}>
                  <Text style={styles.pickerText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          <TouchableOpacity 
            style={[
              styles.btn, 
              (product?.stock === 0) && { backgroundColor: '#ccc' } // Using ?. just in case
            ]}
            onPress={handleAddToCart}
            disabled={product?.stock === 0}
          >
            <Text style={styles.btnText}>
              {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20 },
  image: { width: '100%', height: 300, resizeMode: 'contain' },
  info: { marginTop: 20 },
  name: { fontSize: 24, fontWeight: 'bold' },
  category: { color: '#888', marginBottom: 5 },
  price: { fontSize: 22, color: 'green', fontWeight: 'bold', marginVertical: 5 },
  desc: { marginTop: 10, lineHeight: 22, color: '#444' },
  stockStatus: { marginTop: 10, fontSize: 12, color: '#666' },
  quantitySection: { flexDirection: 'row', alignItems: 'center', marginTop: 25, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  quantityLabel: { fontSize: 18, fontWeight: '600', marginRight: 20 },
  picker: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
  pickerBtn: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#f8f8f8' },
  pickerText: { fontSize: 20, fontWeight: 'bold' },
  quantityNumber: { fontSize: 18, fontWeight: 'bold', paddingHorizontal: 20 },
  btn: { backgroundColor: '#007AFF', padding: 18, borderRadius: 10, marginTop: 20, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});