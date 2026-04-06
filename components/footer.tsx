import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Footer() {
  return (
    <View style={styles.footer}>
      <Text style={styles.text}>© 2024 Phone E-Store</Text>
      <Text style={styles.subtext}>USC Assignment - Jamal Waddell</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { padding: 20, alignItems: 'center', backgroundColor: '#f9f9f9', borderTopWidth: 1, borderTopColor: '#eee' },
  text: { fontSize: 14, color: '#333', fontWeight: 'bold' },
  subtext: { fontSize: 12, color: '#888' }
});