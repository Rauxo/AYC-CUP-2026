import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io('https://ayccup.zarviatechstar.in');

const MatchesList = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
    
    socket.on('matchCreated', (newMatch) => {
      setMatches(prev => [newMatch, ...prev]);
    });
    
    socket.on('matchUpdated', (updatedMatch) => {
      setMatches(prev => prev.map(m => m._id === updatedMatch._id ? updatedMatch : m));
    });

    return () => {
      socket.off('matchCreated');
      socket.off('matchUpdated');
    };
  }, []);

  const fetchMatches = async () => {
    try {
      const res = await fetch('https://ayccup.zarviatechstar.in/api/matches');
      const data = await res.json();
      setMatches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading matches...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-8 text-gray-800 border-b pb-4">All Matches</h2>
      
      {matches.length === 0 ? (
        <p className="text-gray-500 text-center text-lg">No matches found.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {matches.map(match => (
            <Link to={`/matches/${match._id}`} key={match._id} className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-xl transition hover-scale block relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-16 h-16 flex items-center justify-center transform translate-x-4 -translate-y-4 rounded-full ${
                match.status === 'live' ? 'bg-red-500 text-white' : 
                match.status === 'completed' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
              }`}>
                <span className="text-xs font-bold uppercase rotate-45 transform translate-y-2 -translate-x-1">{match.status}</span>
              </div>
              
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{match.name}</h3>
              
              <div className="flex justify-between items-center mb-4">
                <div className="text-left w-2/5">
                  <p className="font-bold text-lg text-gray-800">{match.teamA.name}</p>
                  {(match.status === 'live' || match.status === 'completed') && (
                    <p className="text-xl font-black text-primary-500">
                      {match.score.teamA.runs}/{match.score.teamA.wickets} <span className="text-xs text-gray-500 font-normal">({match.score.teamA.overs})</span>
                    </p>
                  )}
                </div>
                <div className="text-center w-1/5 text-gray-300 font-bold italic">VS</div>
                <div className="text-right w-2/5">
                  <p className="font-bold text-lg text-gray-800">{match.teamB.name}</p>
                  {(match.status === 'live' || match.status === 'completed') && (
                    <p className="text-xl font-black text-primary-500">
                      {match.score.teamB.runs}/{match.score.teamB.wickets} <span className="text-xs text-gray-500 font-normal">({match.score.teamB.overs})</span>
                    </p>
                  )}
                </div>
              </div>
              
              {match.status === 'completed' && match.result && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                  <p className="text-green-600 font-bold text-sm">{match.result}</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchesList;
