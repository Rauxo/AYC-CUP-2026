import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../_config';
import AdminDashboard from '../../components/AdminDashboard';

export default function AdminScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('adminToken');
        if (storedToken) {
          setToken(storedToken);
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error('Failed to load token', e);
      } finally {
        setInitialCheckDone(true);
      }
    };
    checkToken();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      // Safely parse JSON — guard against HTML error pages
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Server returned non-JSON:', text.slice(0, 200));
        setError('Server error: unexpected response. Check backend.');
        return;
      }

      if (res.ok && data.token) {
        setIsLoggedIn(true);
        setToken(data.token);
        await AsyncStorage.setItem('adminToken', data.token);
      } else {
        setError(data.msg || data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error', err);
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggedIn(false);
    setToken(null);
    await AsyncStorage.removeItem('adminToken');
  };

  if (!initialCheckDone) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  if (isLoggedIn && token) {
    return <AdminDashboard token={token} onLogout={handleLogout} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Admin Login</Text>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="admin@ayccup.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16, justifyContent: 'center' },
  center: { flex: 1, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 24 },
  errorText: { backgroundColor: '#fef2f2', color: '#ef4444', padding: 12, borderRadius: 8, textAlign: 'center', marginBottom: 16, fontWeight: 'bold' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#4b5563', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16 },
  button: { backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: '#10b981', textAlign: 'center', marginBottom: 12 },
  successText: { fontSize: 16, color: '#4b5563', textAlign: 'center', marginBottom: 24, lineHeight: 24 }
});
