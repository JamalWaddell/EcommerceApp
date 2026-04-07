import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiFetch } from '../api-to-front/client';
import Header from '../components/header';
import { useCart } from '../context/CartContext';

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<any>(null);
  const { addItem } = useCart();
  const router = useRouter();

  useEffect(() => {
    apiFetch(`/api/products/${id}`).then(setProduct).catch(console.error);
  }, [id]);

  if (!product) return <Text>Loading...</Text>;

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
          
          <TouchableOpacity 
            style={[styles.btn, product.stock === 0 && {backgroundColor: '#ccc'}]}
            disabled={product.stock === 0}
            onPress={() => {
              addItem(product._id, 1);
              router.push('../cart');
            }}
          >
            <Text style={styles.btnText}>{product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  image: { width: '100%', height: 300, resizeMode: 'contain' },
  info: { marginTop: 20 },
  name: { fontSize: 24, fontWeight: 'bold' },
  category: { color: '#888', marginBottom: 10 },
  price: { fontSize: 22, color: 'green', fontWeight: 'bold' },
  desc: { marginTop: 15, lineHeight: 22, color: '#444' },
  btn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, marginTop: 30, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});