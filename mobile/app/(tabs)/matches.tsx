import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import io from 'socket.io-client';
import { API_URL } from '../_config';

export default function MatchesScreen() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchMatches = async () => {
    try {
      const res = await fetch(`${API_URL}/api/matches`);
      const data = await res.json();
      setMatches(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMatches();
  }, []);

  useEffect(() => {
    fetchMatches();
    
    const socket = io(API_URL, { path: '/api/socket.io' });
    socket.on('matchCreated', (newMatch: any) => {
      setMatches(prev => [newMatch, ...prev]);
    });
    socket.on('matchUpdated', (updatedMatch: any) => {
      setMatches(prev => prev.map(m => m._id === updatedMatch._id ? updatedMatch : m));
    });

    return () => {
      socket.off('matchCreated');
      socket.off('matchUpdated');
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 10 }}>Loading matches...</Text>
      </View>
    );
  }

  const getStatusColor = (status: any) => {
    if (status === 'live') return '#ef4444';
    if (status === 'completed') return '#22c55e';
    return '#9ca3af';
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
    >
      <Text style={styles.title}>All Matches</Text>

      {matches.length === 0 ? (
        <Text style={styles.emptyText}>No matches found.</Text>
      ) : (
        matches.map((match: any) => (
          <TouchableOpacity 
            key={match._id} 
            style={styles.card}
            onPress={() => router.push(`/match/${match._id}`)}
          >
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(match.status) }]}>
              <Text style={styles.statusText}>{match.status.toUpperCase()}</Text>
            </View>
            
            <Text style={styles.matchName}>{match.name}</Text>

            <View style={styles.teamsRow}>
              <View style={styles.teamBoxLeft}>
                <Text style={styles.teamName}>{match.teamA.name}</Text>
                {(match.status === 'live' || match.status === 'completed') && (
                  <Text style={styles.scoreText}>
                    {match.score.teamA.runs}/{match.score.teamA.wickets} <Text style={styles.overText}>({match.score.teamA.overs})</Text>
                  </Text>
                )}
              </View>
              
              <Text style={styles.vsText}>VS</Text>
              
              <View style={styles.teamBoxRight}>
                <Text style={styles.teamName}>{match.teamB.name}</Text>
                {(match.status === 'live' || match.status === 'completed') && (
                  <Text style={styles.scoreText}>
                    {match.score.teamB.runs}/{match.score.teamB.wickets} <Text style={styles.overText}>({match.score.teamB.overs})</Text>
                  </Text>
                )}
              </View>
            </View>

            {match.status === 'completed' && match.result && (
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>{match.result}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))
      )}
      <View style={{height: 40}}/>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 10 },
  emptyText: { textAlign: 'center', color: '#6b7280', fontSize: 16, marginTop: 20 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, overflow: 'hidden' },
  statusBadge: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 12, paddingVertical: 4, borderBottomLeftRadius: 12 },
  statusText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  matchName: { fontSize: 12, fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 16, marginTop: 8 },
  teamsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamBoxLeft: { flex: 2, alignItems: 'flex-start' },
  teamBoxRight: { flex: 2, alignItems: 'flex-end' },
  teamName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  scoreText: { fontSize: 18, fontWeight: '900', color: '#3b82f6', marginTop: 4 },
  overText: { fontSize: 12, color: '#6b7280', fontWeight: 'normal' },
  vsText: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 'bold', color: '#d1d5db', fontStyle: 'italic' },
  resultBox: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', alignItems: 'center' },
  resultText: { color: '#16a34a', fontWeight: 'bold', fontSize: 14 }
});
