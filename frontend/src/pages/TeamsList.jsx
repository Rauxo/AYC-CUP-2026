import React, { useEffect, useState } from 'react';

const TeamsList = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/teams');
      const data = await res.json();
      setTeams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-xl font-semibold">Loading teams...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-extrabold mb-8 text-gray-800 border-b pb-4">All Teams</h2>
      
      {teams.length === 0 ? (
        <p className="text-gray-500 text-center text-lg">No teams found.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {teams.map(team => (
            <div key={team._id} className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-xl transition hover-scale">
              <h3 className="text-xl font-bold text-gray-800 mb-4">{team.name}</h3>
              {team.players && team.players.length > 0 ? (
                <button 
                  onClick={() => setSelectedTeam(selectedTeam === team._id ? null : team._id)}
                  className="bg-primary-50 text-primary-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-100 transition w-full"
                >
                  {selectedTeam === team._id ? 'Hide Players' : 'View Players'}
                </button>
              ) : (
                <p className="text-sm text-gray-400 italic">No players added</p>
              )}
              
              {selectedTeam === team._id && team.players && team.players.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                  <ul className="list-disc pl-4 text-sm text-gray-700">
                    {team.players.map((p, i) => (
                      <li key={i} className="mb-1">{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamsList;
