import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Trophy, LogOut } from 'lucide-react';

const Navbar = () => {
  const { isAdmin, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-blue-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold flex items-center gap-2 hover-scale">
          <Trophy className="text-yellow-400" />
          AYC CUP 2026
        </Link>
        <div className="flex gap-6 items-center font-medium">
          <Link to="/" className="hover:text-yellow-300 transition">Home</Link>
          <Link to="/matches" className="hover:text-yellow-300 transition">Matches</Link>
          <Link to="/teams" className="hover:text-yellow-300 transition">Teams</Link>
          {isAdmin ? (
            <>
              <Link to="/admin/dashboard" className="bg-yellow-400 text-primary-500 px-4 py-1 rounded-full font-bold hover:bg-yellow-300 transition shadow-md">Dashboard</Link>
              <button onClick={handleLogout} className="flex items-center gap-1 hover:text-red-300 transition"><LogOut size={18}/> Logout</button>
            </>
          ) : (
            <Link to="/admin" className="hover:text-gray-200 text-sm opacity-70 transition">Admin Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
