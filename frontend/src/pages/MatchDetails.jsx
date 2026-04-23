import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const MatchDetails = () => {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchMatch();

    socket.on('matchUpdated', (updatedMatch) => {
      if (updatedMatch._id === id) {
        setMatch(updatedMatch);
      }
    });

    return () => {
      socket.off('matchUpdated');
    };
  }, [id]);

  const fetchMatch = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/matches/${id}`);
      const data = await res.json();
      setMatch(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading scorecard...</div>;
  if (!match) return <div className="text-center py-20 text-xl text-red-500">Match not found.</div>;

  const batTeam = match.battingTeam === match.teamA.name ? match.teamA : match.teamB;
  const bowlTeam = match.bowlingTeam === match.teamA.name ? match.teamA : match.teamB;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 text-center relative">
        {match.status === 'live' && (
          <span className="absolute top-6 left-6 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">LIVE</span>
        )}
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">{match.name}</h2>
        <div className="flex justify-center items-center gap-8 mt-6">
          <div className="text-right">
            <h3 className="text-2xl font-bold">{match.teamA.name}</h3>
            <p className="text-4xl font-black text-yellow-400 mt-2">{match.score.teamA.runs}/{match.score.teamA.wickets}</p>
            <p className="text-sm text-gray-400 mt-1">Overs: {match.score.teamA.overs}</p>
          </div>
          <div className="text-2xl font-black text-gray-500 italic">VS</div>
          <div className="text-left">
            <h3 className="text-2xl font-bold">{match.teamB.name}</h3>
            <p className="text-4xl font-black text-yellow-400 mt-2">{match.score.teamB.runs}/{match.score.teamB.wickets}</p>
            <p className="text-sm text-gray-400 mt-1">Overs: {match.score.teamB.overs}</p>
          </div>
        </div>
        {match.result && <p className="mt-6 text-lg font-bold text-green-400">{match.result}</p>}
        {match.toss && match.toss.wonBy && (
          <p className="mt-2 text-sm text-gray-300">{match.toss.wonBy} won the toss and selected to {match.toss.decision}</p>
        )}
      </div>

      {match.status !== 'upcoming' && (() => {
        let firstBattingTeamName = match.teamA.name;
        if (match.toss && match.toss.decision) {
          firstBattingTeamName = match.toss.decision === 'bat' ? match.toss.wonBy : (match.toss.wonBy === match.teamA.name ? match.teamB.name : match.teamA.name);
        }
        const secondBattingTeamName = firstBattingTeamName === match.teamA.name ? match.teamB.name : match.teamA.name;

        const renderInnings = (batTeamName, bowlTeamName, isInningsActive) => {
          if (!isInningsActive) return null;
          const batTeam = match.teamA.name === batTeamName ? match.teamA : match.teamB;
          const bowlTeam = match.teamA.name === bowlTeamName ? match.teamA : match.teamB;
          
          return (
            <div className="p-8 bg-gray-50 mb-0 border-t-0 border-gray-200">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h4 className="text-xl font-bold text-gray-800">{batTeam.name} Batting</h4>
                <span className="font-bold text-lg">{match.score[batTeamName === match.teamA.name ? 'teamA' : 'teamB'].runs}/{match.score[batTeamName === match.teamA.name ? 'teamA' : 'teamB'].wickets} <span className="text-sm font-normal text-gray-500">({match.score[batTeamName === match.teamA.name ? 'teamA' : 'teamB'].overs} ov)</span></span>
              </div>
              
              <div className="overflow-x-auto mb-8">
                <table className="w-full text-left bg-white rounded-lg overflow-hidden shadow-sm">
                  <thead className="bg-gray-100 text-gray-600 text-sm">
                    <tr>
                      <th className="p-3">Batter</th>
                      <th className="p-3 text-center">R</th>
                      <th className="p-3 text-center">B</th>
                      <th className="p-3 text-center">4s</th>
                      <th className="p-3 text-center">6s</th>
                      <th className="p-3 text-center">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batTeam.players.map(p => {
                      const hasBatted = p.runsScored > 0 || p.ballsFaced > 0 || p.isStriker || p.isNonStriker || p.isDismissed;
                      return (
                        <tr key={p.name} className="border-t border-gray-50">
                          <td className="p-3 font-semibold text-gray-800">
                            {p.name} {p.isStriker && <span className="text-primary-500">*</span>}
                            {p.isDismissed && <span className="block text-xs text-gray-500 font-normal">{p.dismissalInfo}</span>}
                            {(!p.isDismissed && !p.isStriker && !p.isNonStriker && hasBatted) && <span className="block text-xs text-gray-500 font-normal">not out</span>}
                            {!hasBatted && <span className="block text-xs text-gray-400 font-normal italic">Yet to bat</span>}
                          </td>
                          <td className="p-3 text-center font-bold">{hasBatted ? p.runsScored : '-'}</td>
                          <td className="p-3 text-center text-gray-600">{hasBatted ? p.ballsFaced : '-'}</td>
                          <td className="p-3 text-center text-gray-600">{hasBatted ? p.fours : '-'}</td>
                          <td className="p-3 text-center text-gray-600">{hasBatted ? p.sixes : '-'}</td>
                          <td className="p-3 text-center text-gray-600">{(hasBatted && p.ballsFaced > 0) ? ((p.runsScored / p.ballsFaced) * 100).toFixed(1) : (hasBatted ? '0.0' : '-')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <h4 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">Bowling: {bowlTeam.name}</h4>
              <div className="overflow-x-auto mb-2">
                <table className="w-full text-left bg-white rounded-lg overflow-hidden shadow-sm">
                  <thead className="bg-gray-100 text-gray-600 text-sm">
                    <tr>
                      <th className="p-3">Bowler</th>
                      <th className="p-3 text-center">O</th>
                      <th className="p-3 text-center">M</th>
                      <th className="p-3 text-center">R</th>
                      <th className="p-3 text-center">W</th>
                      <th className="p-3 text-center">ECON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bowlTeam.players.filter(p => p.oversBowled > 0 || p.isBowling).map(p => (
                      <tr key={p.name} className="border-t border-gray-50">
                        <td className="p-3 font-semibold text-gray-800">{p.name} {p.isBowling && <span className="text-primary-500">*</span>}</td>
                        <td className="p-3 text-center font-bold">{p.oversBowled}</td>
                        <td className="p-3 text-center text-gray-600">0</td>
                        <td className="p-3 text-center text-gray-600">{p.runsConceded}</td>
                        <td className="p-3 text-center font-bold text-red-500">{p.wicketsTaken}</td>
                        <td className="p-3 text-center text-gray-600">{p.oversBowled > 0 ? (p.runsConceded / p.oversBowled).toFixed(1) : '-'}</td>
                      </tr>
                    ))}
                    {bowlTeam.players.filter(p => p.oversBowled > 0 || p.isBowling).length === 0 && (
                      <tr><td colSpan="6" className="p-3 text-center text-gray-500 italic">No bowlers used yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        };

        const hasSecondInnings = match.currentInnings === 2 || match.status === 'completed';

        return (
          <div className="bg-white">
            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 py-4 text-center font-bold text-lg transition ${
                  activeTab === 0
                    ? 'border-b-4 border-primary-500 text-primary-500'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab(0)}
              >
                {firstBattingTeamName} Innings
              </button>
              {hasSecondInnings && (
                <button
                  className={`flex-1 py-4 text-center font-bold text-lg transition ${
                    activeTab === 1
                      ? 'border-b-4 border-primary-500 text-primary-500'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveTab(1)}
                >
                  {secondBattingTeamName} Innings
                </button>
              )}
            </div>

            <div className="p-0">
              {activeTab === 0 && renderInnings(firstBattingTeamName, secondBattingTeamName, true)}
              {activeTab === 1 && hasSecondInnings && renderInnings(secondBattingTeamName, firstBattingTeamName, true)}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default MatchDetails;
