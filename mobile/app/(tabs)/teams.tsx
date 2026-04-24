import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { API_URL } from '../config';

export default function TeamsScreen() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch(`${API_URL}/api/teams`);
      const data = await res.json();
      setTeams(data);
    } catch (err) {
      console.error('Error fetching teams', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 10 }}>Loading teams...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>All Teams</Text>

      {teams.length === 0 ? (
        <Text style={styles.emptyText}>No teams found.</Text>
      ) : (
        teams.map((team: any) => (
          <View key={team._id} style={styles.card}>
            <Text style={styles.teamName}>{team.name}</Text>
            
            {team.players && team.players.length > 0 ? (
              <TouchableOpacity 
                style={styles.button}
                onPress={() => setSelectedTeam(selectedTeam === team._id ? null : team._id)}
              >
                <Text style={styles.buttonText}>
                  {selectedTeam === team._id ? 'Hide Players' : 'View Players'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.noPlayersText}>No players added</Text>
            )}

            {selectedTeam === team._id && team.players && team.players.length > 0 && (
              <View style={styles.playersContainer}>
                {team.players.map((p: any, i: number) => (
                  <Text key={i} style={styles.playerText}>• {p}</Text>
                ))}
              </View>
            )}
          </View>
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
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  teamName: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  button: { backgroundColor: '#eff6ff', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#2563eb', fontWeight: 'bold' },
  noPlayersText: { fontStyle: 'italic', color: '#9ca3af', fontSize: 14 },
  playersContainer: { marginTop: 16, backgroundColor: '#f9fafb', padding: 12, borderRadius: 8 },
  playerText: { fontSize: 14, color: '#4b5563', marginBottom: 4 }
});
