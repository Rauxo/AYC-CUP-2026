import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import io from 'socket.io-client';
import { API_URL } from '../config';

export default function MatchDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchMatch();
    const socket = io(API_URL);

    socket.on('matchUpdated', (updatedMatch: any) => {
      if (updatedMatch._id === id) {
        setMatch(updatedMatch);
      }
    });

    return () => {
      socket.off('matchUpdated');
      socket.disconnect();
    };
  }, [id]);

  const fetchMatch = async () => {
    try {
      const res = await fetch(`${API_URL}/api/matches/${id}`);
      const data = await res.json();
      setMatch(data);
    } catch (err) {
      console.error('Error fetching match details', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ marginTop: 10 }}>Loading scorecard...</Text>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red', fontSize: 18 }}>Match not found.</Text>
      </View>
    );
  }

  const renderInnings = (batTeamName: any, bowlTeamName: any) => {
    const batTeam = match.teamA.name === batTeamName ? match.teamA : match.teamB;
    const bowlTeam = match.teamA.name === bowlTeamName ? match.teamA : match.teamB;
    const teamKey = batTeamName === match.teamA.name ? 'teamA' : 'teamB';
    const currentScore = match.score[teamKey];

    return (
      <View style={styles.inningsContainer}>
        <View style={styles.inningsHeader}>
          <Text style={styles.inningsTitle}>{batTeam.name} Batting</Text>
          <Text style={styles.inningsScore}>
            {currentScore.runs}/{currentScore.wickets} <Text style={{fontSize: 12, fontWeight: 'normal'}}>({currentScore.overs} ov)</Text>
          </Text>
        </View>

        {/* Batting Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, {flex: 3}]}>Batter</Text>
          <Text style={styles.th}>R</Text>
          <Text style={styles.th}>B</Text>
          <Text style={styles.th}>4s</Text>
          <Text style={styles.th}>6s</Text>
          <Text style={styles.th}>SR</Text>
        </View>
        
        {/* Batting Table Rows */}
        {batTeam.players.map((p: any) => {
          const hasBatted = p.runsScored > 0 || p.ballsFaced > 0 || p.isStriker || p.isNonStriker || p.isDismissed;
          return (
            <View key={p.name} style={styles.tableRow}>
              <View style={{flex: 3}}>
                <Text style={styles.playerName}>
                  {p.name} {p.isStriker && <Text style={{color: '#3b82f6'}}>*</Text>}
                </Text>
                {p.isDismissed && <Text style={styles.playerSub}>{p.dismissalInfo}</Text>}
                {(!p.isDismissed && !p.isStriker && !p.isNonStriker && hasBatted) && <Text style={styles.playerSub}>not out</Text>}
                {!hasBatted && <Text style={[styles.playerSub, {fontStyle: 'italic'}]}>Yet to bat</Text>}
              </View>
              <Text style={[styles.td, {fontWeight: 'bold'}]}>{hasBatted ? p.runsScored : '-'}</Text>
              <Text style={styles.td}>{hasBatted ? p.ballsFaced : '-'}</Text>
              <Text style={styles.td}>{hasBatted ? p.fours : '-'}</Text>
              <Text style={styles.td}>{hasBatted ? p.sixes : '-'}</Text>
              <Text style={styles.td}>{(hasBatted && p.ballsFaced > 0) ? ((p.runsScored / p.ballsFaced) * 100).toFixed(1) : (hasBatted ? '0.0' : '-')}</Text>
            </View>
          );
        })}

        <View style={{marginTop: 24}}>
          <Text style={styles.inningsTitle}>Bowling: {bowlTeam.name}</Text>
          {/* Bowling Table Header */}
          <View style={[styles.tableHeader, {marginTop: 8}]}>
            <Text style={[styles.th, {flex: 3}]}>Bowler</Text>
            <Text style={styles.th}>O</Text>
            <Text style={styles.th}>M</Text>
            <Text style={styles.th}>R</Text>
            <Text style={styles.th}>W</Text>
            <Text style={styles.th}>ECO</Text>
          </View>
          
          {/* Bowling Table Rows */}
          {bowlTeam.players.filter((p: any) => p.oversBowled > 0 || p.isBowling).length > 0 ? (
            bowlTeam.players.filter((p: any) => p.oversBowled > 0 || p.isBowling).map((p: any) => (
              <View key={p.name} style={styles.tableRow}>
                <Text style={[styles.playerName, {flex: 3}]}>
                  {p.name} {p.isBowling && <Text style={{color: '#3b82f6'}}>*</Text>}
                </Text>
                <Text style={[styles.td, {fontWeight: 'bold'}]}>{p.oversBowled}</Text>
                <Text style={styles.td}>0</Text>
                <Text style={styles.td}>{p.runsConceded}</Text>
                <Text style={[styles.td, {color: '#ef4444', fontWeight: 'bold'}]}>{p.wicketsTaken}</Text>
                <Text style={styles.td}>{p.oversBowled > 0 ? (p.runsConceded / p.oversBowled).toFixed(1) : '-'}</Text>
              </View>
            ))
          ) : (
            <Text style={{padding: 10, textAlign: 'center', color: '#9ca3af'}}>No bowlers used yet</Text>
          )}
        </View>
      </View>
    );
  };

  let firstBattingTeamName = match.teamA.name;
  if (match.toss && match.toss.decision) {
    firstBattingTeamName = match.toss.decision === 'bat' ? match.toss.wonBy : (match.toss.wonBy === match.teamA.name ? match.teamB.name : match.teamA.name);
  }
  const secondBattingTeamName = firstBattingTeamName === match.teamA.name ? match.teamB.name : match.teamA.name;
  const hasSecondInnings = match.currentInnings === 2 || match.status === 'completed';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        {match.status === 'live' && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
        <Text style={styles.heroTitle}>{match.name}</Text>
        
        <View style={styles.teamsRow}>
          <View style={styles.teamBox}>
            <Text style={styles.teamName}>{match.teamA.name}</Text>
            <Text style={styles.scoreText}>{match.score.teamA.runs}/{match.score.teamA.wickets}</Text>
            <Text style={styles.overText}>Overs: {match.score.teamA.overs}</Text>
          </View>
          <Text style={styles.vsText}>VS</Text>
          <View style={styles.teamBox}>
            <Text style={styles.teamName}>{match.teamB.name}</Text>
            <Text style={styles.scoreText}>{match.score.teamB.runs}/{match.score.teamB.wickets}</Text>
            <Text style={styles.overText}>Overs: {match.score.teamB.overs}</Text>
          </View>
        </View>

        {match.result && <Text style={styles.resultText}>{match.result}</Text>}
        {match.toss && match.toss.wonBy && (
          <Text style={styles.tossText}>{match.toss.wonBy} won the toss and elected to {match.toss.decision}</Text>
        )}
      </View>

      {match.status !== 'upcoming' && (
        <View style={styles.tabsContainer}>
          <View style={styles.tabRow}>
            <TouchableOpacity 
              style={[styles.tabBtn, activeTab === 0 && styles.tabBtnActive]} 
              onPress={() => setActiveTab(0)}
            >
              <Text style={[styles.tabBtnText, activeTab === 0 && styles.tabBtnTextActive]}>{firstBattingTeamName}</Text>
            </TouchableOpacity>
            {hasSecondInnings && (
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 1 && styles.tabBtnActive]} 
                onPress={() => setActiveTab(1)}
              >
                <Text style={[styles.tabBtnText, activeTab === 1 && styles.tabBtnTextActive]}>{secondBattingTeamName}</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.tabContent}>
            {activeTab === 0 && renderInnings(firstBattingTeamName, secondBattingTeamName)}
            {activeTab === 1 && hasSecondInnings && renderInnings(secondBattingTeamName, firstBattingTeamName)}
          </View>
        </View>
      )}
      <View style={{height: 40}}/>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { backgroundColor: '#1f2937', padding: 24, alignItems: 'center', position: 'relative' },
  liveBadge: { position: 'absolute', top: 16, left: 16, backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  liveText: { color: 'white', fontWeight: 'bold', fontSize: 10 },
  heroTitle: { color: '#9ca3af', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 16 },
  teamsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  teamBox: { flex: 1, alignItems: 'center' },
  teamName: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  scoreText: { color: '#facc15', fontSize: 28, fontWeight: '900', marginTop: 8 },
  overText: { color: '#9ca3af', fontSize: 12, marginTop: 4 },
  vsText: { color: '#6b7280', fontSize: 20, fontWeight: '900', fontStyle: 'italic', marginHorizontal: 16 },
  resultText: { color: '#4ade80', fontSize: 16, fontWeight: 'bold', marginTop: 24, textAlign: 'center' },
  tossText: { color: '#d1d5db', fontSize: 12, marginTop: 8, textAlign: 'center' },
  tabsContainer: { backgroundColor: 'white', marginTop: 8 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tabBtn: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 3, borderBottomColor: '#3b82f6' },
  tabBtnText: { color: '#6b7280', fontWeight: 'bold', fontSize: 14 },
  tabBtnTextActive: { color: '#3b82f6' },
  tabContent: { padding: 0 },
  inningsContainer: { padding: 16 },
  inningsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 8 },
  inningsTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  inningsScore: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', paddingVertical: 8, paddingHorizontal: 8, borderRadius: 4 },
  th: { flex: 1, fontSize: 12, color: '#4b5563', fontWeight: 'bold', textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center' },
  playerName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  playerSub: { fontSize: 10, color: '#6b7280' },
  td: { flex: 1, fontSize: 14, color: '#4b5563', textAlign: 'center' }
});
