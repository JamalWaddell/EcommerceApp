import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react'; // Make sure useState is imported!
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { apiFetch } from '../../api-to-front/client';
import Footer from '../../components/footer';
import Header from '../../components/header';
import { useAuth } from '../../context/AuthContext';

export default function OrdersScreen() {
  const { user, isLoggedIn, loading } = useAuth();
  const router = useRouter();

  // State for orders
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // FIX 1: Added the missing useEffect
  useEffect(() => {
    // Only fetch if we are definitely logged in
    if (isLoggedIn) {
      setOrdersLoading(true); // Reset loading state
      apiFetch('/api/orders')
        .then(data => setOrders(data.orders || []))
        .catch(err => console.error("Failed to fetch orders", err))
        .finally(() => setOrdersLoading(false));
    }
  }, [isLoggedIn]); 

  // 1. Handle Global Auth Loading (Initial App Load)
  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  // 2. Handle "Not Logged In" - Show the Button (Removed the 'return null')
  if (!isLoggedIn) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ marginBottom: 20, textAlign: 'center' }}>
          User needs to be logged in to view orders. Click the button below to go to the login page.
        </Text>
        <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => router.push('/login')}
        >
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. Handle Data Loading (Fetching Orders)
  if (ordersLoading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  // 4. Render the Orders List
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header title="My Orders" />
      <FlatList
        data={orders}
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

// Basic styles (optional, but good practice)
const styles = StyleSheet.create({
  empty: { textAlign: 'center', marginTop: 50, color: '#888' },
  orderCard: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  orderId: { fontWeight: 'bold', fontSize: 16 },
  status: { fontWeight: '600' },
  date: { color: '#666', fontSize: 12, marginBottom: 5 },
  total: { fontSize: 16, fontWeight: 'bold' },
  itemsCount: { color: '#888', fontSize: 12, marginTop: 2 },
  loginButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8 },
  loginButtonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' }
});