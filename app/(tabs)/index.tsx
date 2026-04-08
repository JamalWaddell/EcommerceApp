// ProductListing.tsx for displaying list of products with filtering options

// Importing necessary modules and components
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { apiFetch } from '../../api-to-front/client';
import Header from '../../components/header';

// ProductListing component that fetches and displays products with filtering options
export default function ProductListing() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

  const [category, setCategory] = useState('All');
  const [maxPrice, setMaxPrice] = useState('');
  const [color, setColor] = useState('All');

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [category, maxPrice, color, products]);

  const loadProducts = async () => {
    try {
      const data = await apiFetch('/api/products');
      setProducts(data);
    } catch (e) { console.error(e); }
  };

  // Filters for each category
  const applyFilters = () => {
    let temp = [...products];
    if (category !== 'All') temp = temp.filter(p => p.category === category);
    if (color !== 'All') temp = temp.filter(p => p.colour === color);
    if (maxPrice !== '') temp = temp.filter(p => p.price <= parseFloat(maxPrice));
    setFilteredProducts(temp);
  };

  // Reset filters to default values
  const resetFilters = () => {
    setCategory('All');
    setMaxPrice('');
    setColor('All');
  };

  // Render the product listing with filters and navigation to product details
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header title="E-Store" />

  {/*Filter options for category, color, and max price*/}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
          {['All', 'Smartphone', 'Tablet', 'Laptop'].map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.chip, category === cat && styles.activeChip]}
            >
              <Text style={category === cat ? styles.whiteText : {}}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            placeholder="Max Price"
            keyboardType="numeric"
            value={maxPrice}
            onChangeText={setMaxPrice}
            style={styles.input}
          />
          <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
            <Text style={{ color: 'red' }}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Renders all products in a grid style. This includes images details etc. Also checks products are in stock */}
      <FlatList
        data={filteredProducts}
        numColumns={2}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ flexGrow: 1 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 50 }}>
            No products found
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`../product/${item._id}`)}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.img} />
            <Text style={styles.prodName}>{item.name}</Text>
            <Text style={styles.prodPrice}>${item.price}</Text>
            <Text style={styles.prodStock}>
              {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// Styles for the ProductListing screen
const styles = StyleSheet.create({
  filterContainer: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  row: { flexDirection: 'row', marginBottom: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#eee', marginRight: 10 },
  activeChip: { backgroundColor: '#007AFF' },
  whiteText: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 8, width: '60%' },
  resetBtn: { padding: 10 },
  card: { flex: 0.5, padding: 10, margin: 5, borderWidth: 1, borderColor: '#eee', borderRadius: 10 },
  img: { width: '100%', height: 120, resizeMode: 'contain' },
  prodName: { fontWeight: 'bold', marginTop: 5 },
  prodPrice: { color: 'green', marginVertical: 2 },
  prodStock: { fontSize: 10, color: '#666' },
});