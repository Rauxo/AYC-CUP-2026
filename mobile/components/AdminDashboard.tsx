import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, FlatList, Alert, RefreshControl } from 'react-native';
import io from 'socket.io-client';
import { API_URL } from '../app/_config';

const CustomSelect = ({ label, value, options, onSelect, placeholder }: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <View style={styles.inputGroup}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity style={styles.selectBox} onPress={() => setModalVisible(true)}>
         <Text style={{ color: value ? '#000' : '#888' }}>
            {value ? (options.find((o: any) => o.value === value)?.label || value) : placeholder}
         </Text>
      </TouchableOpacity>
      <Modal visible={modalVisible} transparent animationType="slide">
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{placeholder}</Text>
              <FlatList 
                 data={options}
                 keyExtractor={(item, idx) => item.value + idx.toString()}
                 renderItem={({item}) => (
                    <TouchableOpacity style={styles.modalOption} onPress={() => { onSelect(item.value); setModalVisible(false); }}>
                       <Text style={styles.modalOptionText}>{item.label}</Text>
                    </TouchableOpacity>
                 )}
              />
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                 <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
         </View>
      </Modal>
    </View>
  );
};

export default function AdminDashboard({ token, onLogout }: { token: string, onLogout: () => void }) {
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [selectedTeamHistory, setSelectedTeamHistory] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Match State
  const [newMatchName, setNewMatchName] = useState('');
  const [newTotalOvers, setNewTotalOvers] = useState('20');
  const [newTeamA, setNewTeamA] = useState('');
  const [newTeamB, setNewTeamB] = useState('');

  // Team & Round State
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPlayers, setNewTeamPlayers] = useState('');
  const [newRoundName, setNewRoundName] = useState('');

  // Start Match & Scoring State
  const [tossWonBy, setTossWonBy] = useState('');
  const [tossDecision, setTossDecision] = useState('bat');
  const [battingTeam, setBattingTeam] = useState('');
  const [bowlingTeam, setBowlingTeam] = useState('');
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');

  // Scoring State
  const [runs, setRuns] = useState<number>(0);
  const [extraType, setExtraType] = useState('');
  const [isWicket, setIsWicket] = useState(false);
  const [wicketType, setWicketType] = useState('bowled');
  const [playerDismissed, setPlayerDismissed] = useState('');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchMatches(), fetchTeams(), fetchRounds()]).then(() => {
      setRefreshing(false);
    });
  }, []);

  useEffect(() => {
    fetchMatches();
    fetchTeams();
    fetchRounds();

    const socket = io(API_URL);
    socket.on('matchCreated', (newMatch: any) => {
      setMatches(prev => [newMatch, ...prev]);
    });
    socket.on('matchUpdated', (updatedMatch: any) => {
      setMatches(prev => prev.map(m => m._id === updatedMatch._id ? updatedMatch : m));
      setActiveMatch(prev => prev && prev._id === updatedMatch._id ? updatedMatch : prev);
    });

    return () => {
      socket.off('matchCreated');
      socket.off('matchUpdated');
      socket.disconnect();
    };
  }, []);

  const fetchMatches = async () => {
    try {
      const res = await fetch(`${API_URL}/api/matches`);
      const data = await res.json();
      setMatches(data);
    } catch(e) {}
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch(`${API_URL}/api/teams`);
      const data = await res.json();
      setTeams(data);
    } catch(e) {}
  };

  const fetchRounds = async () => {
    try {
      const res = await fetch(`${API_URL}/api/rounds`);
      const data = await res.json();
      setRounds(data);
    } catch(e) {}
  };

  useEffect(() => {
    if (activeMatch && activeMatch.status === 'live') {
      const batTeam = activeMatch.battingTeam === activeMatch.teamA.name ? activeMatch.teamA : activeMatch.teamB;
      const bowlTeam = activeMatch.bowlingTeam === activeMatch.teamA.name ? activeMatch.teamA : activeMatch.teamB;
      const s = batTeam.players.find((p:any) => p.isStriker);
      const ns = batTeam.players.find((p:any) => p.isNonStriker);
      const b = bowlTeam.players.find((p:any) => p.isBowling);
      setStriker(s ? s.name : '');
      setNonStriker(ns ? ns.name : '');
      setBowler(b ? b.name : '');
    }
  }, [activeMatch]);

  const handleCreateMatch = async () => {
    if (!newMatchName || !newTeamA || !newTeamB || !newTotalOvers) return Alert.alert('Error', 'Fill all fields');
    try {
      const res = await fetch(`${API_URL}/api/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newMatchName, teamA: newTeamA, teamB: newTeamB, totalOvers: Number(newTotalOvers) })
      });
      if (res.ok) {
        setNewMatchName(''); setNewTeamA(''); setNewTeamB(''); setNewTotalOvers('20');
        fetchMatches();
        Alert.alert('Success', 'Match created');
      }
    } catch(e) {}
  };

  const handleCreateTeam = async () => {
    if (!newTeamName) return Alert.alert('Error', 'Team name required');
    const players = newTeamPlayers.split(',').map(p => p.trim()).filter(p => p);
    try {
      const res = await fetch(`${API_URL}/api/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newTeamName, players })
      });
      if (res.ok) {
        setNewTeamName(''); setNewTeamPlayers('');
        fetchTeams();
        Alert.alert('Success', 'Team created');
      } else {
        Alert.alert('Error', 'Failed to create team. It might already exist.');
      }
    } catch(e) {}
  };

  const handleCreateRound = async () => {
    if (!newRoundName) return Alert.alert('Error', 'Round name required');
    try {
      const res = await fetch(`${API_URL}/api/rounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newRoundName })
      });
      if (res.ok) {
        setNewRoundName('');
        fetchRounds();
        Alert.alert('Success', 'Title added');
      }
    } catch(e) {}
  };

  const handleStartMatch = async () => {
    if(!tossWonBy || !battingTeam || !bowlingTeam || !striker || !nonStriker || !bowler) return Alert.alert('Error', 'Fill all fields');
    try {
      const res = await fetch(`${API_URL}/api/matches/${activeMatch._id}/start`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tossWonBy, tossDecision, battingTeam, bowlingTeam, striker, nonStriker, bowler })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveMatch(data);
        fetchMatches();
      }
    } catch(e) {}
  };

  const handleEndMatch = async () => {
    Alert.alert('End Match', 'Are you sure you want to end this match manually?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: async () => {
          const res = await fetch(`${API_URL}/api/matches/${activeMatch._id}/end`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ result: 'Match ended by admin' })
          });
          if (res.ok) {
            const data = await res.json();
            setActiveMatch(data);
            fetchMatches();
          }
      }}
    ]);
  };

  const handleScoreBall = async () => {
    if(!striker || !nonStriker || !bowler) return Alert.alert('Error', 'Select all players');
    if(isWicket && !playerDismissed) return Alert.alert('Error', 'Select dismissed player');

    const payload = {
      runs,
      extras: extraType ? { type: extraType, runs: 0 } : null,
      wicket: isWicket ? { isWicket: true, type: wicketType, playerDismissed } : null,
      striker,
      nonStriker,
      bowler
    };

    try {
      const res = await fetch(`${API_URL}/api/matches/${activeMatch._id}/ball`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setActiveMatch(data);
        setRuns(0);
        setExtraType('');
        setIsWicket(false);
      }
    } catch(e) {}
  };

  const activeBattingTeamPlayers = activeMatch?.status === 'live' 
    ? (activeMatch.battingTeam === activeMatch.teamA.name ? activeMatch.teamA.players : activeMatch.teamB.players).filter((p:any) => !p.isDismissed)
    : [];
  const activeBowlingTeamPlayers = activeMatch?.status === 'live'
    ? (activeMatch.bowlingTeam === activeMatch.teamA.name ? activeMatch.teamA.players : activeMatch.teamB.players)
    : [];

  const getMatchOutcome = (match: any) => {
    if (match.winner && match.loser) return { winner: match.winner, loser: match.loser };
    return { winner: 'Tie', loser: 'Tie' };
  };

  const eliminatedTeams = new Set();
  matches.forEach(m => {
    if (m.status === 'completed') {
      const outcome = getMatchOutcome(m);
      if (outcome.loser && outcome.loser !== 'Tie') {
        eliminatedTeams.add(outcome.loser);
      }
    }
  });
  const activeTeams = teams.filter(t => !eliminatedTeams.has(t.name));

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {!activeMatch ? (
        <View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create New Match</Text>
            <CustomSelect placeholder="Select Match Title" value={newMatchName} onSelect={setNewMatchName} options={rounds.map(r => ({label: r.name, value: r.name}))} />
            <TextInput style={styles.input} placeholder="Total Overs" value={newTotalOvers} onChangeText={setNewTotalOvers} keyboardType="numeric" />
            <CustomSelect placeholder="Select Team A" value={newTeamA} onSelect={setNewTeamA} options={teams.map(t => ({label: t.name, value: t.name}))} />
            <CustomSelect placeholder="Select Team B" value={newTeamB} onSelect={setNewTeamB} options={teams.map(t => ({label: t.name, value: t.name}))} />
            <TouchableOpacity style={styles.primaryButton} onPress={handleCreateMatch}><Text style={styles.buttonText}>Create Match</Text></TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Manage Matches</Text>
            {matches.length === 0 && <Text style={{color: '#888'}}>No matches available</Text>}
            {matches.map(m => (
              <TouchableOpacity key={m._id} style={styles.matchItem} onPress={() => setActiveMatch(m)}>
                <Text style={styles.matchTeams}>{m.teamA.name} vs {m.teamB.name}</Text>
                <Text style={styles.matchStatus}>{m.name} - <Text style={{color: m.status === 'live' ? 'red' : 'gray', fontWeight: m.status==='live'?'bold':'normal'}}>{m.status}</Text></Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create New Team</Text>
            <TextInput style={styles.input} placeholder="Team Name" value={newTeamName} onChangeText={setNewTeamName} />
            <TextInput style={[styles.input, {height: 60}]} placeholder="Comma separated player names" multiline value={newTeamPlayers} onChangeText={setNewTeamPlayers} />
            <TouchableOpacity style={styles.primaryButton} onPress={handleCreateTeam}><Text style={styles.buttonText}>Create Team</Text></TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Match Title</Text>
            <TextInput style={styles.input} placeholder="Round Name (e.g. Semi-Final)" value={newRoundName} onChangeText={setNewRoundName} />
            <TouchableOpacity style={styles.primaryButton} onPress={handleCreateRound}><Text style={styles.buttonText}>Create Title</Text></TouchableOpacity>
          </View>

          {/* TOURNAMENT RESULTS SECTION */}
          <View style={styles.card}>
             <Text style={styles.cardTitle}>Tournament Standings</Text>
             <Text style={styles.subTitle}>🏆 Undefeated Teams</Text>
             <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16}}>
                {activeTeams.length > 0 ? activeTeams.map(t => (
                  <View key={t._id} style={{backgroundColor: '#d1fae5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, margin: 4}}>
                    <Text style={{color: '#065f46', fontWeight: 'bold'}}>{t.name}</Text>
                  </View>
                )) : <Text style={{fontStyle: 'italic', color: '#6b7280'}}>No undefeated teams remaining.</Text>}
             </View>

             <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8, marginBottom: 12}}>
               <Text style={{fontSize: 16, fontWeight: 'bold', color: '#374151'}}>📊 Match History</Text>
             </View>
             <CustomSelect placeholder="All Teams (Grouped by Round)" value={selectedTeamHistory} onSelect={setSelectedTeamHistory} options={[
                {label: 'All Teams (Grouped by Round)', value: ''},
                ...teams.map(t => ({label: t.name, value: t.name}))
             ]} />
             
             {selectedTeamHistory ? (() => {
               const teamMatches = matches.filter(m => m.status === 'completed' && (m.teamA.name === selectedTeamHistory || m.teamB.name === selectedTeamHistory));
               const wins = teamMatches.filter(m => getMatchOutcome(m).winner === selectedTeamHistory).length;
               const losses = teamMatches.filter(m => getMatchOutcome(m).loser === selectedTeamHistory).length;
               
               return (
                 <View style={{marginTop: 12}}>
                    <View style={{flexDirection: 'row', gap: 8, marginBottom: 12}}>
                      <Text style={{backgroundColor: '#eff6ff', color: '#1e40af', padding: 8, borderRadius: 8, fontWeight: 'bold', overflow: 'hidden'}}>Total: {teamMatches.length}</Text>
                      <Text style={{backgroundColor: '#f0fdf4', color: '#166534', padding: 8, borderRadius: 8, fontWeight: 'bold', overflow: 'hidden'}}>Wins: {wins}</Text>
                      <Text style={{backgroundColor: '#fef2f2', color: '#991b1b', padding: 8, borderRadius: 8, fontWeight: 'bold', overflow: 'hidden'}}>Losses: {losses}</Text>
                    </View>
                    
                    {teamMatches.length > 0 ? teamMatches.map((m, idx) => {
                      const outcome = getMatchOutcome(m);
                      const isWin = outcome.winner === selectedTeamHistory;
                      const isLoss = outcome.loser === selectedTeamHistory;
                      const opponent = m.teamA.name === selectedTeamHistory ? m.teamB.name : m.teamA.name;
                      
                      return (
                        <View key={m._id} style={{backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#eee'}}>
                           <Text style={{fontWeight: 'bold', color: '#374151', marginBottom: 4}}>{idx + 1}. {m.name}</Text>
                           <Text style={{color: '#4b5563', marginBottom: 4}}>vs <Text style={{fontWeight: 'bold', color: '#111827'}}>{opponent}</Text></Text>
                           <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                              {isWin ? <Text style={{color: '#10b981', fontWeight: 'bold'}}>Win</Text> : (isLoss ? <Text style={{color: '#ef4444', fontWeight: 'bold'}}>Loss</Text> : <Text style={{color: '#6b7280', fontWeight: 'bold'}}>Tie</Text>)}
                              <Text style={{fontSize: 12, color: '#6b7280', flex: 1, textAlign: 'right', marginLeft: 8}}>{isWin ? m.result : '-'}</Text>
                           </View>
                        </View>
                      );
                    }) : <Text style={{fontStyle: 'italic', color: '#6b7280', textAlign: 'center', marginVertical: 16}}>No completed matches for this team.</Text>}
                 </View>
               );
             })() : (
               rounds.map(round => {
                  const roundMatches = matches.filter(m => m.status === 'completed' && m.name === round.name);
                  if (roundMatches.length === 0) return null;
                  return (
                    <View key={round._id} style={{marginBottom: 16}}>
                      <Text style={{fontWeight: 'bold', color: '#4b5563', marginBottom: 8, textTransform: 'uppercase', fontSize: 12}}>{round.name} Results</Text>
                      {roundMatches.map(m => {
                        const outcome = getMatchOutcome(m);
                        return (
                          <View key={m._id} style={{backgroundColor: '#f9fafb', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#eee'}}>
                            <Text style={{fontWeight: 'bold', color: '#047857', marginBottom: 2}}>Winner: {outcome.winner !== 'Tie' ? outcome.winner : 'Tie'}</Text>
                            <Text style={{fontWeight: 'bold', color: '#dc2626', marginBottom: 4}}>Loser: {outcome.loser !== 'Tie' ? outcome.loser : 'Tie'}</Text>
                            <Text style={{fontSize: 12, color: '#6b7280'}}>{m.result}</Text>
                          </View>
                        );
                      })}
                    </View>
                  );
               })
             )}
             
             {!selectedTeamHistory && matches.filter(m => m.status === 'completed').length === 0 && (
                <Text style={{fontStyle: 'italic', color: '#6b7280', textAlign: 'center', marginVertical: 16}}>No completed matches yet.</Text>
             )}
          </View>
        </View>
      ) : (
        <View style={styles.card}>
           <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
              <Text style={[styles.cardTitle, {flex: 1, marginRight: 8}]}>{activeMatch.teamA.name} vs {activeMatch.teamB.name}</Text>
              <TouchableOpacity onPress={() => setActiveMatch(null)} style={{padding: 8}}><Text style={{color: 'blue', fontWeight: 'bold'}}>Back</Text></TouchableOpacity>
           </View>
           
           <Text style={styles.badge}>{activeMatch.status}</Text>

           {activeMatch.status === 'upcoming' && (
             <View>
               <Text style={styles.subTitle}>Start Match Setup</Text>
               <CustomSelect placeholder="Toss won by" value={tossWonBy} onSelect={setTossWonBy} options={[{label: activeMatch.teamA.name, value: activeMatch.teamA.name}, {label: activeMatch.teamB.name, value: activeMatch.teamB.name}]} />
               <CustomSelect placeholder="Toss decision" value={tossDecision} onSelect={setTossDecision} options={[{label: 'Bat', value: 'bat'}, {label: 'Bowl', value: 'bowl'}]} />
               <CustomSelect placeholder="Batting Team" value={battingTeam} onSelect={setBattingTeam} options={[{label: activeMatch.teamA.name, value: activeMatch.teamA.name}, {label: activeMatch.teamB.name, value: activeMatch.teamB.name}]} />
               <CustomSelect placeholder="Bowling Team" value={bowlingTeam} onSelect={setBowlingTeam} options={[{label: activeMatch.teamA.name, value: activeMatch.teamA.name}, {label: activeMatch.teamB.name, value: activeMatch.teamB.name}]} />
               
               {battingTeam ? (
                 <>
                   <CustomSelect placeholder="Striker" value={striker} onSelect={setStriker} options={(battingTeam === activeMatch.teamA.name ? activeMatch.teamA.players : activeMatch.teamB.players).map((p:any) => ({label: p.name, value: p.name}))} />
                   <CustomSelect placeholder="Non-Striker" value={nonStriker} onSelect={setNonStriker} options={(battingTeam === activeMatch.teamA.name ? activeMatch.teamA.players : activeMatch.teamB.players).map((p:any) => ({label: p.name, value: p.name}))} />
                 </>
               ) : null}
               {bowlingTeam ? (
                 <CustomSelect placeholder="Bowler" value={bowler} onSelect={setBowler} options={(bowlingTeam === activeMatch.teamA.name ? activeMatch.teamA.players : activeMatch.teamB.players).map((p:any) => ({label: p.name, value: p.name}))} />
               ) : null}

               <TouchableOpacity style={styles.primaryButton} onPress={handleStartMatch}><Text style={styles.buttonText}>Start Match</Text></TouchableOpacity>
             </View>
           )}

           {activeMatch.status === 'live' && (
             <View>
                <View style={styles.scoreBoard}>
                  <Text style={{fontSize: 16, fontWeight: 'bold', color: '#555'}}>Batting: {activeMatch.battingTeam}</Text>
                  <Text style={{fontSize: 32, fontWeight: '900'}}>
                    {activeMatch.score[activeMatch.battingTeam === activeMatch.teamA.name ? 'teamA' : 'teamB'].runs}/
                    {activeMatch.score[activeMatch.battingTeam === activeMatch.teamA.name ? 'teamA' : 'teamB'].wickets}
                  </Text>
                  <Text>Overs: {activeMatch.score[activeMatch.battingTeam === activeMatch.teamA.name ? 'teamA' : 'teamB'].overs} / {activeMatch.totalOvers}</Text>
                  {activeMatch.target ? <Text style={{fontWeight: 'bold', color: 'blue', marginTop: 4}}>Target: {activeMatch.target}</Text> : null}
                  <TouchableOpacity style={styles.dangerButton} onPress={handleEndMatch}><Text style={styles.buttonText}>End Match</Text></TouchableOpacity>
                </View>

                <Text style={styles.subTitle}>Scoring Panel</Text>
                
                <CustomSelect label="Striker" placeholder="Select Striker" value={striker} onSelect={setStriker} options={activeBattingTeamPlayers.map((p:any) => ({label: p.name, value: p.name}))} />
                <CustomSelect label="Non-Striker" placeholder="Select Non-Striker" value={nonStriker} onSelect={setNonStriker} options={activeBattingTeamPlayers.map((p:any) => ({label: p.name, value: p.name}))} />
                <CustomSelect label="Bowler" placeholder="Select Bowler" value={bowler} onSelect={setBowler} options={activeBowlingTeamPlayers.map((p:any) => ({label: p.name, value: p.name}))} />

                <Text style={styles.label}>Runs off bat</Text>
                <View style={styles.runsContainer}>
                  {[0,1,2,3,4,5,6].map(r => (
                    <TouchableOpacity key={r} style={[styles.runButton, runs === r && styles.runButtonActive]} onPress={() => setRuns(r)}>
                      <Text style={[styles.runText, runs === r && styles.runTextActive]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <CustomSelect label="Extras" placeholder="None" value={extraType} onSelect={setExtraType} options={[
                  {label: 'None', value: ''}, {label: 'Wide', value: 'wide'}, {label: 'No Ball', value: 'noBall'}, {label: 'Bye', value: 'bye'}, {label: 'Leg Bye', value: 'legBye'}
                ]} />

                <View style={styles.wicketBox}>
                  <TouchableOpacity onPress={() => setIsWicket(!isWicket)} style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={[styles.checkbox, isWicket && styles.checkboxActive]} />
                    <Text style={styles.wicketLabel}>Wicket?</Text>
                  </TouchableOpacity>
                  
                  {isWicket && (
                    <View style={{marginTop: 12}}>
                      <CustomSelect placeholder="Wicket Type" value={wicketType} onSelect={setWicketType} options={[
                        {label: 'Bowled', value: 'bowled'}, {label: 'Caught', value: 'caught'}, {label: 'Run Out', value: 'run-out'}, {label: 'LBW', value: 'lbw'}, {label: 'Stumped', value: 'stumped'}
                      ]} />
                      <CustomSelect placeholder="Dismissed Player" value={playerDismissed} onSelect={setPlayerDismissed} options={[
                        ...(striker ? [{label: striker, value: striker}] : []),
                        ...(nonStriker ? [{label: nonStriker, value: nonStriker}] : [])
                      ]} />
                    </View>
                  )}
                </View>

                <TouchableOpacity style={[styles.primaryButton, {marginTop: 20}]} onPress={handleScoreBall}>
                  <Text style={styles.buttonText}>Submit Ball</Text>
                </TouchableOpacity>
             </View>
           )}

           {activeMatch.status === 'completed' && (
             <View style={{paddingVertical: 20, alignItems: 'center'}}>
               <Text style={{fontSize: 20, color: 'green', fontWeight: 'bold'}}>Match Completed</Text>
               <Text style={{fontSize: 16, marginTop: 8}}>{activeMatch.result}</Text>
             </View>
           )}
        </View>
      )}
      <View style={{height: 100}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  headerText: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  logoutBtn: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  logoutText: { color: 'white', fontWeight: 'bold' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#374151' },
  subTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16, backgroundColor: '#f9fafb' },
  primaryButton: { backgroundColor: '#3b82f6', padding: 14, borderRadius: 8, alignItems: 'center' },
  dangerButton: { backgroundColor: '#ef4444', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  matchItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#f9fafb', marginBottom: 8, borderRadius: 8 },
  matchTeams: { fontWeight: 'bold', fontSize: 16 },
  matchStatus: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#e5e7eb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 12, marginBottom: 16, overflow: 'hidden' },
  scoreBoard: { backgroundColor: '#f3f4f6', padding: 16, borderRadius: 8, marginBottom: 20 },
  
  label: { fontSize: 14, fontWeight: '600', color: '#4b5563', marginBottom: 8 },
  inputGroup: { marginBottom: 12 },
  selectBox: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 14, backgroundColor: '#f9fafb' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%', padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalOption: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalOptionText: { fontSize: 16 },
  closeButton: { marginTop: 16, backgroundColor: '#ef4444', padding: 14, borderRadius: 8, alignItems: 'center' },
  closeButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  runsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 },
  runButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  runButtonActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  runText: { fontSize: 18, fontWeight: 'bold', color: '#374151' },
  runTextActive: { color: 'white' },
  
  wicketBox: { backgroundColor: '#fef2f2', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#fee2e2', marginTop: 16 },
  wicketLabel: { color: '#dc2626', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  checkbox: { width: 20, height: 20, borderWidth: 2, borderColor: '#dc2626', borderRadius: 4 },
  checkboxActive: { backgroundColor: '#dc2626' }
});
