// order.tsx which displays the user's past orders and their details

// Importing necessary modules and components
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiFetch } from '../../api-to-front/client';
import Header from '../../components/header';
import { useAuth } from '../../context/AuthContext';

// Type definitions for Product, OrderItem, and Order
type Product = { _id: string; name?: string; productName?: string; imageUrl: string; price: number };
type OrderItem = { productId: string; quantity: number; product?: Product | null };
type Order = { orderId: string; items: OrderItem[]; total: number; createdAt: string; status?: string };

// OrdersScreen component that displays the user's past orders and their details
export default function OrdersScreen() {
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Fetches orders from the API and enriches them with product details
  const fetchOrders = async () => {
    setOrdersLoading(true);
    apiFetch('/api/orders')
      .then(async (data: { orders: Order[] }) =>
        Promise.all(data.orders.map(async o => ({
          ...o,
          items: await Promise.all(o.items.map(async i => {
            try { return { ...i, product: await apiFetch(`/api/products/${i.productId}`) }; }
            catch { return { ...i, product: null }; }
          }))
        })))
      )
      .then(setOrders)
      .catch(console.error)
      .finally(() => setOrdersLoading(false));
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchOrders();
  }, [isLoggedIn]);

  if (loading || ordersLoading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  if (!isLoggedIn) return <View style={styles.center}><Text>Please log in to view your orders.</Text></View>;

  // Render the orders list with details and status
  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <Header title="My Orders" />

      <TouchableOpacity onPress={fetchOrders} style={styles.refreshBtn}>
        <Text style={styles.refreshText}>↻ Refresh Status</Text>
      </TouchableOpacity>

      <FlatList
        data={orders}
        keyExtractor={i => i.orderId}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={<Text style={styles.empty}>No orders found.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.topRow}>
              <Text style={styles.orderId}>Order: {item.orderId}</Text>
              <Text style={[
                styles.status,
                item.status === 'Delivered' ? styles.delivered : styles.processing
              ]}>
                {item.status || 'Processing'}
              </Text>
            </View>
            {item.items.map(i => (
              <View key={i.productId} style={styles.row}>
                <Image
                  source={{
                    uri: i.product?.imageUrl?.startsWith('http')
                      ? i.product.imageUrl
                      : `http://192.168.1.10:5000/images/${i.product?.imageUrl || ''}`
                  }}
                  style={styles.img}
                />
                <Text style={styles.name}>
                  {i.product?.name || i.product?.productName || 'Unknown'}
                </Text>
                <Text style={styles.qty}>x{i.quantity}</Text>
              </View>
            ))}
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            <Text style={styles.total}>Total: ${item.total.toFixed(2)}</Text>
          </View>
        )}
      />
    </View>
  );
}

// Styles for the Orders screen
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 50, color: '#888' },
  card: { padding: 15, margin: 10, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderId: { fontWeight: 'bold', fontSize: 16 },
  status: { fontWeight: 'bold', fontSize: 13 },
  processing: { color: 'orange' },
  delivered: { color: 'green' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderBottomWidth: 0.5, borderBottomColor: '#eee', paddingBottom: 5 },
  img: { width: 45, height: 45, marginRight: 10, borderRadius: 5, backgroundColor: '#eee' },
  name: { flex: 1, fontSize: 14 },
  qty: { fontWeight: 'bold' },
  date: { marginTop: 10, fontSize: 12, color: '#666' },
  total: { marginTop: 5, fontWeight: 'bold', fontSize: 16 },
  refreshBtn: { margin: 10, padding: 10, backgroundColor: 'green', borderRadius: 8, alignItems: 'center' },
  refreshText: { color: '#fff', fontWeight: 'bold' },
});