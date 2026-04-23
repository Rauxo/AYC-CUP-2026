import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { isAdmin, token } = useContext(AuthContext);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [activeMatch, setActiveMatch] = useState(null);
  
  // Create Match State
  const [newMatchName, setNewMatchName] = useState('');
  const [newTotalOvers, setNewTotalOvers] = useState(20);
  const [newTeamA, setNewTeamA] = useState('');
  const [newTeamB, setNewTeamB] = useState('');

  // Create Team & Round State
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPlayers, setNewTeamPlayers] = useState('');
  const [newRoundName, setNewRoundName] = useState('');
  
  // Filters
  const [selectedTeamHistory, setSelectedTeamHistory] = useState('');

  // Start Match & Scoring State
  const [tossWonBy, setTossWonBy] = useState('');
  const [tossDecision, setTossDecision] = useState('bat');
  const [battingTeam, setBattingTeam] = useState('');
  const [bowlingTeam, setBowlingTeam] = useState('');
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');

  // Scoring State
  const [runs, setRuns] = useState(0);
  const [extraType, setExtraType] = useState('');
  const [isWicket, setIsWicket] = useState(false);
  const [wicketType, setWicketType] = useState('bowled');
  const [playerDismissed, setPlayerDismissed] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchMatches();
      fetchTeams();
      fetchRounds();
    }
  }, [isAdmin]);

  const fetchMatches = async () => {
    const res = await fetch('http://localhost:5000/api/matches');
    const data = await res.json();
    setMatches(data);
  };

  const fetchTeams = async () => {
    const res = await fetch('http://localhost:5000/api/teams');
    const data = await res.json();
    setTeams(data);
  };

  const fetchRounds = async () => {
    const res = await fetch('http://localhost:5000/api/rounds');
    const data = await res.json();
    setRounds(data);
  };

  const getMatchOutcome = (match) => {
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

  useEffect(() => {
    if (activeMatch && activeMatch.status === 'live') {
      const batTeam = activeMatch.battingTeam === activeMatch.teamA.name ? activeMatch.teamA : activeMatch.teamB;
      const bowlTeam = activeMatch.bowlingTeam === activeMatch.teamA.name ? activeMatch.teamA : activeMatch.teamB;
      const s = batTeam.players.find(p => p.isStriker);
      const ns = batTeam.players.find(p => p.isNonStriker);
      const b = bowlTeam.players.find(p => p.isBowling);
      if (s) setStriker(s.name);
      if (ns) setNonStriker(ns.name);
      if (b) setBowler(b.name);
    }
  }, [activeMatch]);

  if (!isAdmin) return <Navigate to="/admin" />;

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newMatchName, teamA: newTeamA, teamB: newTeamB, totalOvers: newTotalOvers })
    });
    if (res.ok) {
      setNewMatchName(''); setNewTeamA(''); setNewTeamB(''); setNewTotalOvers(20);
      fetchMatches();
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    const players = newTeamPlayers.split(',').map(p => p.trim()).filter(p => p);
    const res = await fetch('http://localhost:5000/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newTeamName, players })
    });
    if (res.ok) {
      setNewTeamName(''); setNewTeamPlayers('');
      alert('Team created successfully!');
      fetchTeams();
    } else {
      alert('Failed to create team. It might already exist.');
    }
  };

  const handleCreateRound = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/rounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newRoundName })
    });
    if (res.ok) {
      setNewRoundName('');
      fetchRounds();
    }
  };

  const handleEndMatch = async () => {
    if (!window.confirm('Are you sure you want to manually end this match?')) return;
    const res = await fetch(`http://localhost:5000/api/matches/${activeMatch._id}/end`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ result: 'Match ended by admin' })
    });
    if (res.ok) {
      const data = await res.json();
      setActiveMatch(data);
      fetchMatches();
    }
  };

  const handleStartMatch = async (e) => {
    e.preventDefault();
    const res = await fetch(`http://localhost:5000/api/matches/${activeMatch._id}/start`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        tossWonBy, tossDecision,
        battingTeam, bowlingTeam,
        striker, nonStriker, bowler
      })
    });
    if (res.ok) {
      const data = await res.json();
      setActiveMatch(data);
      fetchMatches();
    }
  };

  const handleScoreBall = async (e) => {
    e.preventDefault();
    const payload = {
      runs: parseInt(runs),
      extras: extraType ? { type: extraType, runs: 0 } : null,
      wicket: isWicket ? { isWicket: true, type: wicketType, playerDismissed } : null,
      striker,
      nonStriker,
      bowler
    };

    const res = await fetch(`http://localhost:5000/api/matches/${activeMatch._id}/ball`, {
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
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-8 text-gray-800">Admin Dashboard</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1 space-y-8">
          {/* Create Match */}
          <div className="bg-white p-6 rounded-2xl shadow border border-gray-100">
            <h3 className="text-xl font-bold mb-4">Create New Match</h3>
            <form onSubmit={handleCreateMatch} className="space-y-4">
              <select className="w-full px-3 py-2 border rounded" value={newMatchName} onChange={e=>setNewMatchName(e.target.value)} required>
                <option value="">Select Match Title / Round...</option>
                {rounds.map(r => <option key={r._id} value={r.name}>{r.name}</option>)}
              </select>
              <input type="number" placeholder="Total Overs" className="w-full px-3 py-2 border rounded" value={newTotalOvers} onChange={e=>setNewTotalOvers(Number(e.target.value))} required min="1" />
              <select className="w-full px-3 py-2 border rounded" value={newTeamA} onChange={e=>setNewTeamA(e.target.value)} required>
                <option value="">Select Team A...</option>
                {teams.map(t => <option key={t._id} value={t.name}>{t.name}</option>)}
              </select>
              <select className="w-full px-3 py-2 border rounded" value={newTeamB} onChange={e=>setNewTeamB(e.target.value)} required>
                <option value="">Select Team B...</option>
                {teams.map(t => <option key={t._id} value={t.name}>{t.name}</option>)}
              </select>
              <button type="submit" className="w-full bg-primary-500 text-white font-bold py-2 rounded">Create Match</button>
            </form>
          </div>

          {/* Create Team */}
          <div className="bg-white p-6 rounded-2xl shadow border border-gray-100">
            <h3 className="text-xl font-bold mb-4">Create New Team</h3>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <input type="text" placeholder="Team Name" className="w-full px-3 py-2 border rounded" value={newTeamName} onChange={e=>setNewTeamName(e.target.value)} required />
              <textarea placeholder="Comma separated player names (optional)" className="w-full px-3 py-2 border rounded text-sm" rows="2" value={newTeamPlayers} onChange={e=>setNewTeamPlayers(e.target.value)} />
              <button type="submit" className="w-full bg-indigo-500 text-white font-bold py-2 rounded">Create Team</button>
            </form>
          </div>

          {/* Create Round */}
          <div className="bg-white p-6 rounded-2xl shadow border border-gray-100">
            <h3 className="text-xl font-bold mb-4">Add Match Title</h3>
            <form onSubmit={handleCreateRound} className="space-y-4">
              <input type="text" placeholder="Round Name (e.g. 1st Round, Semi-Final)" className="w-full px-3 py-2 border rounded" value={newRoundName} onChange={e=>setNewRoundName(e.target.value)} required />
              <button type="submit" className="w-full bg-orange-500 text-white font-bold py-2 rounded">Create Title</button>
            </form>
          </div>
          
          {/* Match List */}
          <div className="bg-white p-6 rounded-2xl shadow border border-gray-100 h-96 overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Manage Matches</h3>
            {matches.map(m => (
              <div key={m._id} className={`p-4 border rounded mb-3 cursor-pointer transition ${activeMatch?._id === m._id ? 'border-primary-500 bg-blue-50' : 'hover:bg-gray-50'}`} onClick={() => setActiveMatch(m)}>
                <div className="font-bold">{m.teamA.name} vs {m.teamB.name}</div>
                <div className="text-xs text-gray-500">{m.name} - <span className={m.status==='live'?'text-red-500 font-bold':''}>{m.status}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2">
          {activeMatch ? (
            <div className="bg-white p-6 rounded-2xl shadow border border-gray-100 min-h-full">
              <h3 className="text-2xl font-bold mb-6 text-primary-500">{activeMatch.teamA.name} vs {activeMatch.teamB.name} <span className="text-sm bg-gray-200 text-gray-700 px-2 py-1 rounded ml-2">{activeMatch.status}</span></h3>
              
              {activeMatch.status === 'upcoming' && (
                <form onSubmit={handleStartMatch} className="space-y-4">
                  <h4 className="font-bold border-b pb-2">Start Match Setup</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <select className="px-3 py-2 border rounded" value={tossWonBy} onChange={e=>setTossWonBy(e.target.value)} required>
                      <option value="">Toss won by...</option>
                      <option value={activeMatch.teamA.name}>{activeMatch.teamA.name}</option>
                      <option value={activeMatch.teamB.name}>{activeMatch.teamB.name}</option>
                    </select>
                    <select className="px-3 py-2 border rounded" value={tossDecision} onChange={e=>setTossDecision(e.target.value)}>
                      <option value="bat">Bat</option>
                      <option value="bowl">Bowl</option>
                    </select>
                    <select className="px-3 py-2 border rounded" value={battingTeam} onChange={e=>setBattingTeam(e.target.value)} required>
                      <option value="">Batting Team...</option>
                      <option value={activeMatch.teamA.name}>{activeMatch.teamA.name}</option>
                      <option value={activeMatch.teamB.name}>{activeMatch.teamB.name}</option>
                    </select>
                    <select className="px-3 py-2 border rounded" value={bowlingTeam} onChange={e=>setBowlingTeam(e.target.value)} required>
                      <option value="">Bowling Team...</option>
                      <option value={activeMatch.teamA.name}>{activeMatch.teamA.name}</option>
                      <option value={activeMatch.teamB.name}>{activeMatch.teamB.name}</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <select className="px-3 py-2 border rounded" value={striker} onChange={e=>setStriker(e.target.value)} required>
                      <option value="">Striker...</option>
                      {battingTeam && (battingTeam === activeMatch.teamA.name ? activeMatch.teamA.players : activeMatch.teamB.players).map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                    <select className="px-3 py-2 border rounded" value={nonStriker} onChange={e=>setNonStriker(e.target.value)} required>
                      <option value="">Non-Striker...</option>
                      {battingTeam && (battingTeam === activeMatch.teamA.name ? activeMatch.teamA.players : activeMatch.teamB.players).map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                    <select className="px-3 py-2 border rounded" value={bowler} onChange={e=>setBowler(e.target.value)} required>
                      <option value="">Bowler...</option>
                      {bowlingTeam && (bowlingTeam === activeMatch.teamA.name ? activeMatch.teamA.players : activeMatch.teamB.players).map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-green-500 text-white font-bold py-3 rounded hover:bg-green-600 transition">Start Match</button>
                </form>
              )}

              {activeMatch.status === 'live' && (
                <div>
                  <div className="mb-6 bg-gray-100 p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-gray-500">Batting: {activeMatch.battingTeam}</p>
                      <p className="text-3xl font-black">{activeMatch.score[activeMatch.battingTeam === activeMatch.teamA.name ? 'teamA' : 'teamB'].runs}/{activeMatch.score[activeMatch.battingTeam === activeMatch.teamA.name ? 'teamA' : 'teamB'].wickets}</p>
                      <p className="text-sm text-gray-600">Overs: {activeMatch.score[activeMatch.battingTeam === activeMatch.teamA.name ? 'teamA' : 'teamB'].overs} / {activeMatch.totalOvers}</p>
                      {activeMatch.target && <p className="text-sm font-bold text-primary-600 mt-1">Target: {activeMatch.target}</p>}
                    </div>
                    <button onClick={handleEndMatch} className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition text-sm">
                      End Match
                    </button>
                  </div>

                  <form onSubmit={handleScoreBall} className="space-y-6">
                    <h4 className="font-bold border-b pb-2 text-xl">Scoring Panel</h4>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Striker</label>
                        <select className="w-full px-3 py-2 border rounded bg-gray-50" value={striker} onChange={e=>setStriker(e.target.value)} required>
                          <option value="">Select Striker...</option>
                          {(activeMatch.battingTeam === activeMatch.teamA.name ? activeMatch.teamA.players : activeMatch.teamB.players)
                            .filter(p => !p.isDismissed)
                            .map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Non-Striker</label>
                        <select className="w-full px-3 py-2 border rounded bg-gray-50" value={nonStriker} onChange={e=>setNonStriker(e.target.value)} required>
                          <option value="">Select Non-Striker...</option>
                          {(activeMatch.battingTeam === activeMatch.teamA.name ? activeMatch.teamA.players : activeMatch.teamB.players)
                            .filter(p => !p.isDismissed)
                            .map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Bowler</label>
                        <select className="w-full px-3 py-2 border rounded bg-gray-50" value={bowler} onChange={e=>setBowler(e.target.value)} required>
                          <option value="">Select Bowler...</option>
                          {(activeMatch.bowlingTeam === activeMatch.teamA.name ? activeMatch.teamA.players : activeMatch.teamB.players)
                            .map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Runs off bat</label>
                      <div className="flex gap-2">
                        {[0,1,2,3,4,5,6].map(r => (
                          <button type="button" key={r} className={`w-12 h-12 rounded-full font-bold text-lg border ${runs === r ? 'bg-primary-500 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-200'}`} onClick={() => setRuns(r)}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Extras</label>
                        <select className="w-full px-3 py-2 border rounded" value={extraType} onChange={e=>setExtraType(e.target.value)}>
                          <option value="">None</option>
                          <option value="wide">Wide</option>
                          <option value="noBall">No Ball</option>
                          <option value="bye">Bye</option>
                          <option value="legBye">Leg Bye</option>
                        </select>
                      </div>
                      
                      <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                        <label className="flex items-center gap-2 font-bold text-red-600 mb-2 cursor-pointer">
                          <input type="checkbox" checked={isWicket} onChange={e=>setIsWicket(e.target.checked)} className="w-4 h-4" />
                          Wicket?
                        </label>
                        {isWicket && (
                          <div className="space-y-2 mt-3">
                            <select className="w-full px-3 py-2 border rounded text-sm" value={wicketType} onChange={e=>setWicketType(e.target.value)}>
                              <option value="bowled">Bowled</option>
                              <option value="caught">Caught</option>
                              <option value="run-out">Run Out</option>
                              <option value="lbw">LBW</option>
                              <option value="stumped">Stumped</option>
                            </select>
                            <select className="w-full px-3 py-2 border rounded text-sm" value={playerDismissed} onChange={e=>setPlayerDismissed(e.target.value)} required={isWicket}>
                              <option value="">Select Dismissed Player</option>
                              {striker && <option value={striker}>{striker}</option>}
                              {nonStriker && <option value={nonStriker}>{nonStriker}</option>}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-primary-500 text-white font-extrabold py-4 rounded-xl shadow-lg hover:bg-primary-600 hover-scale text-xl transition">
                      Submit Ball
                    </button>
                  </form>
                </div>
              )}

              {activeMatch.status === 'completed' && (
                <div className="text-center py-10">
                  <h4 className="text-2xl font-bold text-green-500 mb-2">Match Completed</h4>
                  <p className="text-xl font-bold">{activeMatch.result}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-gray-200 h-full flex items-center justify-center text-gray-400 min-h-[400px]">
              Select a match from the list to manage
            </div>
          )}
        </div>
      </div>

      {/* Tournament Results Section */}
      <div className="mt-12 bg-white p-6 rounded-2xl shadow border border-gray-100">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Tournament Results & Standings</h3>
        
        <div className="mb-8">
          <h4 className="text-lg font-bold text-green-600 mb-3 border-b pb-2">🏆 Undefeated Teams (Still in Tournament)</h4>
          <div className="flex flex-wrap gap-3">
            {activeTeams.length > 0 ? activeTeams.map(t => (
              <span key={t._id} className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold text-sm shadow-sm">{t.name}</span>
            )) : <span className="text-gray-500 italic">No undefeated teams remaining.</span>}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-6 border-b pb-4 mt-6">
            <h4 className="text-xl font-bold text-gray-800">📊 Match History</h4>
            <select className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm" value={selectedTeamHistory} onChange={e => setSelectedTeamHistory(e.target.value)}>
              <option value="">All Teams (Grouped by Round)</option>
              {teams.map(t => <option key={t._id} value={t.name}>{t.name}</option>)}
            </select>
          </div>

          {selectedTeamHistory ? (() => {
            const teamMatches = matches.filter(m => m.status === 'completed' && (m.teamA.name === selectedTeamHistory || m.teamB.name === selectedTeamHistory));
            const wins = teamMatches.filter(m => getMatchOutcome(m).winner === selectedTeamHistory).length;
            const losses = teamMatches.filter(m => getMatchOutcome(m).loser === selectedTeamHistory).length;
            
            return (
              <div>
                <div className="flex gap-4 mb-4">
                  <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg font-bold border border-blue-200">Total Matches: {teamMatches.length}</div>
                  <div className="bg-green-50 text-green-800 px-4 py-2 rounded-lg font-bold border border-green-200">Wins: {wins}</div>
                  <div className="bg-red-50 text-red-800 px-4 py-2 rounded-lg font-bold border border-red-200">Losses: {losses}</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                    <thead className="bg-gray-100 text-gray-600 text-sm">
                      <tr>
                        <th className="p-3">S.No</th>
                        <th className="p-3">Match Title</th>
                        <th className="p-3">Opponent</th>
                        <th className="p-3 text-center">Result</th>
                        <th className="p-3">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMatches.map((m, idx) => {
                        const outcome = getMatchOutcome(m);
                        const isWin = outcome.winner === selectedTeamHistory;
                        const isLoss = outcome.loser === selectedTeamHistory;
                        const opponent = m.teamA.name === selectedTeamHistory ? m.teamB.name : m.teamA.name;
                        return (
                          <tr key={m._id} className="border-t border-gray-50">
                            <td className="p-3 font-semibold text-gray-600">{idx + 1}</td>
                            <td className="p-3 text-gray-600">{m.name}</td>
                            <td className="p-3 font-bold text-gray-800">{opponent}</td>
                            <td className="p-3 text-center">
                              {isWin ? <span className="text-green-500 font-bold">Win</span> : (isLoss ? <span className="text-red-500 font-bold">Loss</span> : <span className="text-gray-500 font-bold">Tie</span>)}
                            </td>
                            <td className="p-3 text-sm text-gray-600">{isWin ? m.result : '-'}</td>
                          </tr>
                        );
                      })}
                      {teamMatches.length === 0 && <tr><td colSpan="5" className="p-4 text-center text-gray-500 italic">No completed matches for this team.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })() : (
            rounds.map(round => {
              const roundMatches = matches.filter(m => m.status === 'completed' && m.name === round.name);
              if (roundMatches.length === 0) return null;
              return (
                <div key={round._id} className="mb-8">
                  <h4 className="text-md font-bold text-gray-600 mb-2 uppercase tracking-wide">{round.name} Results</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                      <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                        <tr>
                          <th className="p-3">Winner</th>
                          <th className="p-3">Loser</th>
                          <th className="p-3">Win Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roundMatches.map(m => {
                          const outcome = getMatchOutcome(m);
                          return (
                            <tr key={m._id} className="border-t border-gray-100">
                              <td className="p-3 font-bold text-green-700">{outcome.winner !== 'Tie' ? outcome.winner : 'Tie'}</td>
                              <td className="p-3 font-bold text-red-600">{outcome.loser !== 'Tie' ? outcome.loser : 'Tie'}</td>
                              <td className="p-3 text-sm text-gray-600">{m.result}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
          
          {!selectedTeamHistory && matches.filter(m => m.status === 'completed').length === 0 && (
             <div className="text-center text-gray-500 italic py-4">No completed matches yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
