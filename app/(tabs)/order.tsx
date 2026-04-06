import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react'; // Make sure useState is imported!
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import Footer from '../../components/footer';
import Header from '../../components/header';
import { apiFetch } from '../api-to-front/client';
import { useAuth } from '../context/AuthContext';

export default function OrdersScreen() {
  const { user, isLoggedIn, loading } = useAuth();
  const router = useRouter();

  // ADDED THIS: The state to hold your orders
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.replace('/login' as any);
      return;
    }

    // ADDED THIS: Fetch the orders once we know the user is logged in
    if (isLoggedIn) {
      apiFetch('/api/orders')
        .then(data => setOrders(data.orders || []))
        .catch(err => console.error("Failed to fetch orders", err))
        .finally(() => setOrdersLoading(false));
    }
  }, [isLoggedIn, loading]);

  // If AuthContext is still loading
  if (loading) return <ActivityIndicator size="large" style={{flex: 1}} />;

  // If not logged in, return null while it redirects
  if (!isLoggedIn) return null;

  // If Auth is finished but we are still fetching orders
  if (ordersLoading) return <ActivityIndicator size="large" style={{flex: 1}} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header title="My Orders" />
      <FlatList
        data={orders} // <-- This will now work perfectly!
        keyExtractor={(item) => item.orderId}
        ListEmptyComponent={<Text style={styles.empty}>No orders found.</Text>}
        ListFooterComponent={<Footer />}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.row}>
              <Text style={styles.orderId}>{item.orderId}</Text>
              <Text style={[styles.status, { color: item.status === 'Processing' ? 'orange' : 'green' }]}>
                {item.status}
              </Text>
            </View>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            <Text style={styles.total}>Total: ${item.total.toFixed(2)}</Text>
            <Text style={styles.itemsCount}>{item.items.length} Items</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: 'center', marginTop: 50, color: '#888' },
  orderCard: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee', marginHorizontal: 10, marginTop: 10, backgroundColor: '#f9f9f9', borderRadius: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  orderId: { fontWeight: 'bold', fontSize: 16 },
  status: { fontWeight: 'bold' },
  date: { color: '#666', fontSize: 12, marginTop: 5 },
  total: { fontSize: 18, fontWeight: 'bold', marginTop: 10, color: '#222' },
  itemsCount: { fontSize: 12, color: '#888' }
});