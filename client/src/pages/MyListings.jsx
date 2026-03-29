import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/store';
import SafetyBadge from '../components/SafetyBadge';

function StatusBadge({ status, urgent }) {
  if (urgent && status === 'available') {
    return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full animate-pulse border border-orange-200 uppercase">Urgent</span>;
  }
  const colors = {
    available: 'bg-green-100 text-green-800',
    claimed: 'bg-blue-100 text-blue-800',
    delivered: 'bg-purple-100 text-purple-800',
    expired: 'bg-gray-100 text-gray-800'
  };
  const color = colors[status] || 'bg-gray-100 text-gray-800';
  return <span className={`px-2 py-1 ${color} text-xs font-bold rounded-full capitalize`}>{status}</span>;
}

function SearchItemCard({ l, cancelClaim, user }) {
  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow transition flex flex-col sm:flex-row justify-between sm:items-center mb-4">
      <div className="mb-4 sm:mb-0">
        <div className="flex items-center space-x-3 mb-2">
          <h3 className="font-bold text-gray-800 text-lg">{l.title}</h3>
          <StatusBadge status={l.status} urgent={l.urgent} />
          {l.safetyScore !== undefined && <SafetyBadge score={l.safetyScore} />}
        </div>
        <p className="text-sm text-gray-600 mb-1 font-medium">{l.quantity} <span className="text-gray-300 mx-1">|</span> {l.foodType} <span className="text-gray-300 mx-1">|</span> Donor: {l.donor?.name || 'Unknown'}</p>
        <p className="text-xs text-gray-400">Listed: {new Date(l.createdAt).toLocaleDateString()}</p>
      </div>
      
      {user.role === 'recipient' && l.status === 'claimed' && (
        <button 
          onClick={() => cancelClaim(l._id)}
          className="self-start sm:self-auto px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded font-semibold text-sm transition"
        >
          Cancel Claim
        </button>
      )}
    </div>
  );
}

export default function MyListings() {
  const [data, setData] = useState({ donated: [], claimed: [], volunteer: [] });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  const token = useAuthStore(s => s.token);
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    api.get('/api/listings/my', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
        setData(res.data);
    })
    .catch(err => {
        console.error(err);
    })
    .finally(() => setLoading(false));
  }, [token, navigate]);

  const isEmpty =
    data.donated.length === 0 &&
    data.claimed.length === 0 &&
    data.volunteer.length === 0;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const cancelClaim = async (id) => {
    try {
      await api.delete(`/api/listings/${id}/claim`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Remove specifically from the claimed array locally
      setData(prev => ({
          ...prev,
          claimed: prev.claimed.filter(l => l._id !== id)
      }));
      showToast('Claim cancelled successfully');
    } catch (err) {
      if (err.response?.status === 403) {
        showToast("You didn't claim this", 'error');
      } else {
        showToast(err.response?.data?.error || 'Failed to cancel claim', 'error');
      }
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 relative">
      {toast && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded shadow-lg z-[9999] text-white font-medium ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="w-full max-w-3xl border-b border-gray-200 pb-4 mb-6 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-green-700">My Activity</h1>
           <p className="text-gray-600 mt-1 text-sm">Your donations, claims and pickups</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">← Back to Dashboard</button>
      </div>

      <div className="w-full max-w-3xl">
        {loading ? (
          <div className="space-y-4 shadow-sm border border-gray-100 bg-white p-6 rounded-lg">
             <div className="animate-pulse bg-gray-200 h-5 w-1/4 rounded mb-4"></div>
             <div className="animate-pulse bg-gray-200 h-4 w-1/3 rounded"></div>
          </div>
        ) : isEmpty ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm mt-4">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            <p className="text-lg text-gray-500 font-medium">Nothing here yet</p>
            <p className="text-sm text-gray-400 mt-1">Check back later when you have activity.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {data.donated.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Food I Posted</h2>
                    {data.donated.map(l => <SearchItemCard key={l._id} l={l} user={user} cancelClaim={cancelClaim} />)}
                </section>
            )}

            {data.claimed.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Food I Claimed</h2>
                    {data.claimed.map(l => <SearchItemCard key={l._id} l={l} user={user} cancelClaim={cancelClaim} />)}
                </section>
            )}

            {data.volunteer.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Pickups I'm Handling</h2>
                    {data.volunteer.map(l => <SearchItemCard key={l._id} l={l} user={user} cancelClaim={cancelClaim} />)}
                </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
