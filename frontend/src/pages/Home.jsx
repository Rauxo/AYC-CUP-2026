import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const Home = () => {
  const [liveMatch, setLiveMatch] = useState(null);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();

    socket.on('matchUpdated', (match) => {
      if (match.status === 'live') setLiveMatch(match);
      else if (liveMatch && match._id === liveMatch._id && match.status === 'completed') {
        setLiveMatch(null); 
      }
      // re-fetch to update upcoming lists if needed
      fetchMatches();
    });

    return () => {
      socket.off('matchUpdated');
    };
  }, [liveMatch]);

  const fetchMatches = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/matches');
      const data = await res.json();
      const live = data.find(m => m.status === 'live');
      setLiveMatch(live);
      
      const upcoming = data.filter(m => m.status === 'upcoming').slice(0, 3);
      setUpcomingMatches(upcoming);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-xl font-semibold animate-pulse">Loading live action...</div>;
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-4xl bg-gradient-to-br from-primary-500 to-indigo-700 text-white rounded-3xl shadow-2xl p-8 mb-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-black opacity-10"></div>
        <h1 className="text-5xl font-extrabold mb-4 relative z-10 drop-shadow-lg">AYC CUP 2026</h1>
        <p className="text-xl opacity-90 relative z-10 mb-8">The ultimate cricket showdown. Experience real-time live scoring!</p>
        <Link to="/matches" className="relative z-10 bg-white text-primary-500 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 hover-scale inline-block shadow-lg">
          View All Matches
        </Link>
      </div>

      <h2 className="text-3xl font-bold mb-6 text-gray-800">Live Match Spotlight</h2>
      
      {liveMatch ? (
        <div className="w-full max-w-3xl glass rounded-2xl shadow-xl p-6 border-t-4 border-yellow-400 hover-scale cursor-pointer" onClick={() => window.location.href=`/matches/${liveMatch._id}`}>
          <div className="flex justify-between items-center mb-6">
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
              <span className="w-2 h-2 bg-white rounded-full"></span> LIVE
            </span>
            <span className="text-sm font-semibold text-gray-500">{liveMatch.name}</span>
          </div>
          
          <div className="flex justify-between items-center text-center">
            <div className="w-1/3">
              <h3 className="text-2xl font-bold text-gray-800">{liveMatch.teamA.name}</h3>
              <p className="text-3xl font-black text-primary-500 mt-2">
                {liveMatch.score.teamA.runs}/{liveMatch.score.teamA.wickets}
              </p>
              <p className="text-sm text-gray-500">Overs: {liveMatch.score.teamA.overs}</p>
            </div>
            
            <div className="text-gray-400 font-bold italic text-xl">VS</div>
            
            <div className="w-1/3">
              <h3 className="text-2xl font-bold text-gray-800">{liveMatch.teamB.name}</h3>
              <p className="text-3xl font-black text-primary-500 mt-2">
                {liveMatch.score.teamB.runs}/{liveMatch.score.teamB.wickets}
              </p>
              <p className="text-sm text-gray-500">Overs: {liveMatch.score.teamB.overs}</p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-600 font-medium">Batting: <span className="font-bold">{liveMatch.battingTeam}</span></p>
            {liveMatch.target && (
              <p className="mt-2 text-primary-600 font-bold bg-primary-50 inline-block px-4 py-1 rounded-full text-sm">
                Target: {liveMatch.target} runs
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md p-10 text-center border border-gray-100">
          <p className="text-xl text-gray-500 font-medium">No live matches at the moment.</p>
          <p className="text-sm text-gray-400 mt-2">Check back later or view completed matches.</p>
        </div>
      )}

      {upcomingMatches.length > 0 && (
        <div className="w-full max-w-4xl mt-16">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Upcoming Matches</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {upcomingMatches.map(m => (
              <div key={m._id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 text-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{m.name}</span>
                <div className="font-bold text-gray-800 mt-2">{m.teamA.name}</div>
                <div className="text-gray-400 italic text-sm my-1">vs</div>
                <div className="font-bold text-gray-800">{m.teamB.name}</div>
                <div className="mt-3 text-xs text-primary-500 font-semibold bg-primary-50 rounded-full py-1">
                  {m.totalOvers} Overs
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
