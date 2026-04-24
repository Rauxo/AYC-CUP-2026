import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import io from 'socket.io-client';
import { API_URL } from '../config';

export default function HomeScreen() {
  const [liveMatch, setLiveMatch] = useState<any>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchMatches();
    const socket = io(API_URL);

    socket.on('matchUpdated', (match: any) => {
      if (match.status === 'live') setLiveMatch(match);
      else if (liveMatch && match._id === liveMatch._id && match.status === 'completed') {
        setLiveMatch(null); 
      }
      fetchMatches();
    });

    return () => {
      socket.off('matchUpdated');
      socket.disconnect();
    };
  }, []);

  const fetchMatches = async () => {
    try {
      const res = await fetch(`${API_URL}/api/matches`);
      const data = await res.json();
      const live = data.find((m: any) => m.status === 'live');
      setLiveMatch(live);
      
      const upcoming = data.filter((m: any) => m.status === 'upcoming').slice(0, 3);
      setUpcomingMatches(upcoming);
    } catch (err) {
      console.error('Error fetching matches', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 10 }}>Loading live action...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>AYC CUP 2026</Text>
        <Text style={styles.bannerSubtitle}>The ultimate cricket showdown.</Text>
        <TouchableOpacity style={styles.bannerBtn} onPress={() => router.push('/(tabs)/matches')}>
          <Text style={styles.bannerBtnText}>View All Matches</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Live Match Spotlight</Text>

      {liveMatch ? (
        <TouchableOpacity style={styles.liveCard} onPress={() => router.push(`/match/${liveMatch._id}`)}>
          <View style={styles.liveHeader}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text style={styles.matchName}>{liveMatch.name}</Text>
          </View>

          <View style={styles.teamsRow}>
            <View style={styles.teamBox}>
              <Text style={styles.teamName}>{liveMatch.teamA.name}</Text>
              <Text style={styles.scoreText}>
                {liveMatch.score.teamA.runs}/{liveMatch.score.teamA.wickets}
              </Text>
              <Text style={styles.overText}>Overs: {liveMatch.score.teamA.overs}</Text>
            </View>

            <Text style={styles.vsText}>VS</Text>

            <View style={styles.teamBox}>
              <Text style={styles.teamName}>{liveMatch.teamB.name}</Text>
              <Text style={styles.scoreText}>
                {liveMatch.score.teamB.runs}/{liveMatch.score.teamB.wickets}
              </Text>
              <Text style={styles.overText}>Overs: {liveMatch.score.teamB.overs}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.battingText}>Batting: {liveMatch.battingTeam}</Text>
            {liveMatch.target && (
              <View style={styles.targetBadge}>
                <Text style={styles.targetText}>Target: {liveMatch.target} runs</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.noLiveCard}>
          <Text style={styles.noLiveText}>No live matches at the moment.</Text>
          <Text style={styles.noLiveSub}>Check back later or view completed matches.</Text>
        </View>
      )}

      {upcomingMatches.length > 0 && (
        <View style={styles.upcomingSection}>
          <Text style={styles.sectionTitle}>Upcoming Matches</Text>
          {upcomingMatches.map((m: any) => (
            <View key={m._id} style={styles.upcomingCard}>
              <Text style={styles.upcomingName}>{m.name}</Text>
              <Text style={styles.upcomingTeams}>{m.teamA.name} <Text style={{fontStyle: 'italic', color: '#888'}}>vs</Text> {m.teamB.name}</Text>
              <Text style={styles.upcomingOvers}>{m.totalOvers} Overs</Text>
            </View>
          ))}
        </View>
      )}
      
      {/* Spacer */}
      <View style={{height: 40}}/>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  banner: { backgroundColor: '#4f46e5', padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 24 },
  bannerTitle: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  bannerSubtitle: { color: 'white', fontSize: 16, opacity: 0.9, marginBottom: 16 },
  bannerBtn: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  bannerBtnText: { color: '#4f46e5', fontWeight: 'bold' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 16, textAlign: 'center' },
  liveCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 24, borderTopWidth: 4, borderTopColor: '#fbbf24', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  liveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  liveBadge: { flexDirection: 'row', backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignItems: 'center' },
  liveDot: { width: 6, height: 6, backgroundColor: 'white', borderRadius: 3, marginRight: 4 },
  liveText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  matchName: { fontSize: 12, color: '#6b7280', fontWeight: 'bold' },
  teamsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamBox: { flex: 1, alignItems: 'center' },
  teamName: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', textAlign: 'center' },
  scoreText: { fontSize: 24, fontWeight: '900', color: '#3b82f6', marginTop: 4 },
  overText: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  vsText: { fontSize: 18, fontWeight: 'bold', color: '#9ca3af', fontStyle: 'italic', marginHorizontal: 10 },
  footer: { marginTop: 24, alignItems: 'center' },
  battingText: { color: '#4b5563', fontWeight: '500' },
  targetBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  targetText: { color: '#2563eb', fontWeight: 'bold', fontSize: 12 },
  noLiveCard: { backgroundColor: 'white', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, elevation: 2 },
  noLiveText: { fontSize: 16, color: '#6b7280', fontWeight: '500' },
  noLiveSub: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
  upcomingSection: { marginTop: 8 },
  upcomingCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center', elevation: 1 },
  upcomingName: { fontSize: 10, fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 },
  upcomingTeams: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
  upcomingOvers: { fontSize: 12, color: '#3b82f6', backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10, fontWeight: 'bold' }
});
