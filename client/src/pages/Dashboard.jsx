import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import { useSocket } from '../hooks/useSocket';
import NotificationBell from '../components/NotificationBell';
import ProfilePanel from '../components/ProfilePanel';
import api from '../utils/api';
import { useNotificationStore } from '../store/notifications';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

export default function Dashboard() {
  const user = useAuthStore(s => s.user);
  const token = useAuthStore(s => s.token);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  const [forecast, setForecast] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState(null);
  
  const [profileOpen, setProfileOpen] = useState(false);

  // Global Impact States tracking Socket responses dynamically
  const impactStats = useNotificationStore(s => s.impactStats);
  const setImpactStats = useNotificationStore(s => s.setImpactStats);

  useEffect(() => {
     api.get('/api/impact')
        .then(res => setImpactStats(res.data))
        .catch(() => {});
  }, [setImpactStats]);

  const resolvedImpact = impactStats || { totalMealsSaved: 0, totalKgFoodSaved: 0, totalCO2Saved: 0, totalDeliveries: 0 };
  const countMeals = useCountUp(resolvedImpact.totalMealsSaved);
  const countFood = useCountUp(resolvedImpact.totalKgFoodSaved);
  const countCO2 = useCountUp(resolvedImpact.totalCO2Saved);
  const countDeliveries = useCountUp(resolvedImpact.totalDeliveries);

  // Live real-time connection
  useSocket(token);

  useEffect(() => {
    if (!token) {
        navigate('/login');
        return;
    }
    api.get('/api/listings/my', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setStats({
        donated: res.data.donated.length,
        claimed: res.data.claimed.length,
        volunteer: res.data.volunteer.length
      });
    })
    .catch(() => {
      // Silently hide errors as per instruction
      setStats(null);
    })
    .finally(() => setLoadingStats(false));

    api.get('/api/analytics/surplus-prediction', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setForecast(res.data.forecast || []);
      setPeakHours(res.data.peakHours || []);
    })
    .catch(err => {
      setForecastError(err.message);
    })
    .finally(() => setForecastLoading(false));

  }, [token, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <>
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-8 md:pt-16 pb-12 px-4 sm:px-6">
      
      {/* Header Area */}
      <div className="w-full max-w-5xl flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 space-y-4 sm:space-y-0">
        <div 
          className="flex items-center space-x-4 cursor-pointer hover:bg-white p-2 rounded-xl transition duration-300 shadow-sm border border-transparent hover:border-gray-200 w-full sm:w-auto" 
          onClick={() => setProfileOpen(true)}
          title="Open Profile"
        >
          <div className="w-14 h-14 bg-green-100 text-green-700 font-extrabold text-2xl flex items-center justify-center rounded-full border-2 border-green-200 shrink-0 shadow-sm">
             {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
              {user.name} 👋
            </h1>
            <p className="mt-1 text-sm md:text-base text-gray-500 font-medium tracking-wide">
              What would you like to do today?
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 sm:space-x-6">
          <NotificationBell />
          <button 
            onClick={handleLogout}
            className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Action Cards */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        
        {/* Card 1: Donate Food */}
        <Link to="/post-listing" className="group flex flex-col bg-green-50 rounded-2xl p-8 border-t-8 border-green-600 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 relative h-full">
            <div className="text-5xl mb-4 text-center">🍱</div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">Donate Food</h2>
            <p className="text-gray-600 text-center mb-8 flex-1">
                Have surplus food? Post a listing and connect with people who need it nearby.
            </p>
            <div className="mt-auto w-full py-3 bg-green-600 text-white font-bold text-center rounded-lg group-hover:bg-green-700 transition">
                Post Food
            </div>
        </Link>
        
        {/* Card 2: Receive Food */}
        <Link to="/feed" className="group flex flex-col bg-blue-50 rounded-2xl p-8 border-t-8 border-blue-600 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 relative h-full">
            <div className="text-5xl mb-4 text-center">🙏</div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">Find Food</h2>
            <p className="text-gray-600 text-center mb-8 flex-1">
                Browse surplus food available near you and claim what you need before it expires.
            </p>
            <div className="mt-auto w-full py-3 bg-blue-600 text-white font-bold text-center rounded-lg group-hover:bg-blue-700 transition">
                Browse Nearby
            </div>
        </Link>

        {/* Card 3: Volunteer */}
        <Link to="/volunteer" className="group flex flex-col bg-orange-50 rounded-2xl p-8 border-t-8 border-orange-600 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 relative h-full">
            <div className="text-5xl mb-4 text-center">🚴</div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">Volunteer</h2>
            <p className="text-gray-600 text-center mb-8 flex-1">
                Help deliver food from donors to recipients. Optimize your route and make an impact.
            </p>
            <div className="mt-auto w-full py-3 bg-orange-600 text-white font-bold text-center rounded-lg group-hover:bg-orange-700 transition">
                View Pickups
            </div>
        </Link>

      </div>

      {/* Mobile Logout (Hidden on Desktop) */}
      <button 
        onClick={handleLogout}
        className="sm:hidden mb-10 px-4 py-3 w-full max-w-sm text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition shadow-sm"
      >
        Logout
      </button>

      {/* Quick Stats Row */}
      <div className="w-full max-w-5xl">
         <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">Your Impact</h3>
         
         {loadingStats ? (
             <div className="flex flex-wrap gap-4">
                <div className="h-12 w-48 bg-gray-200 rounded-full animate-pulse shadow-sm"></div>
                <div className="h-12 w-48 bg-gray-200 rounded-full animate-pulse shadow-sm"></div>
                <div className="h-12 w-48 bg-gray-200 rounded-full animate-pulse shadow-sm"></div>
             </div>
         ) : stats ? (
             (stats.donated === 0 && stats.claimed === 0 && stats.volunteer === 0) ? (
                 <p className="text-gray-500 italic bg-white px-6 py-4 rounded-lg shadow-sm w-full md:w-auto inline-block border border-gray-100">
                     You haven't done anything yet — pick an action above!
                 </p>
             ) : (
                 <div className="flex flex-wrap gap-4">
                     <Link to="/my-listings" className="flex items-center space-x-2 bg-green-50 text-green-800 font-semibold px-5 py-2.5 rounded-full hover:bg-green-100 transition shadow-sm border border-green-200">
                         <span className="text-lg">🍱</span>
                         <span>{stats.donated} Donations made</span>
                     </Link>
                     <Link to="/my-listings" className="flex items-center space-x-2 bg-blue-50 text-blue-800 font-semibold px-5 py-2.5 rounded-full hover:bg-blue-100 transition shadow-sm border border-blue-200">
                         <span className="text-lg">🙏</span>
                         <span>{stats.claimed} Foods claimed</span>
                     </Link>
                     <Link to="/my-listings" className="flex items-center space-x-2 bg-orange-50 text-orange-800 font-semibold px-5 py-2.5 rounded-full hover:bg-orange-100 transition shadow-sm border border-orange-200">
                         <span className="text-lg">🚴</span>
                         <span>{stats.volunteer} Deliveries done</span>
                     </Link>
                 </div>
             )
         ) : null}
      </div>

      {/* Impact Stats Area */}
      <div className="w-full max-w-5xl mt-12 mb-2">
         <h3 className="text-xl font-bold text-gray-800 mb-6 px-1 text-center">Our Impact So Far 🌍</h3>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
               <div className="text-3xl lg:text-4xl font-black text-green-600 mb-1">{countMeals}</div>
               <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Meals Saved 🍽️</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
               <div className="text-3xl lg:text-4xl font-black text-teal-600 mb-1">{(countFood || 0).toFixed(1)}</div>
               <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">kg Food Rescued 📦</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
               <div className="text-3xl lg:text-4xl font-black text-emerald-600 mb-1">{(countCO2 || 0).toFixed(1)}</div>
               <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">kg CO₂ Prevented 🌱</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
               <div className="text-3xl lg:text-4xl font-black text-blue-600 mb-1">{countDeliveries}</div>
               <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Deliveries ✅</div>
            </div>
         </div>
      </div>

      {/* Surplus Forecast Row */}
      <div className="w-full max-w-5xl mt-12 mb-10">
         <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">Surplus Forecast</h3>
         
         <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
           {forecastLoading ? (
             <div className="flex justify-center items-center h-48 text-gray-500 font-medium">
                Loading forecast...
             </div>
           ) : forecastError ? (
             <div className="flex justify-center items-center h-48 text-red-500 font-medium bg-red-50 rounded-xl">
                 Forecast unavailable
             </div>
           ) : (
             <>
                 <div className="w-full overflow-x-auto">
                     <div className="min-w-[500px] h-[300px]">
                         <Bar 
                             data={{
                                 labels: forecast.map(f => f.label),
                                 datasets: [{
                                     label: 'Predicted listings',
                                     data: forecast.map(f => f.predicted),
                                     backgroundColor: forecast.map(f => f.isPeak ? '#F59E0B' : '#0D9488'),
                                     borderRadius: 4
                                 }]
                             }}
                             options={{
                                 responsive: true,
                                 maintainAspectRatio: false,
                                 plugins: { legend: { display: false } },
                                 scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                             }}
                         />
                     </div>
                 </div>
                 
                 <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                     <span className="text-sm font-bold text-gray-700 uppercase tracking-widest">Peak times today:</span>
                     <div className="flex flex-wrap gap-2">
                         {peakHours.length > 0 ? peakHours.map(hour => (
                             <span key={hour} className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full shadow-sm">
                                 {hour}
                             </span>
                         )) : (
                             <span className="text-sm text-gray-500 italic">No peak activity expected</span>
                         )}
                     </div>
                 </div>
             </>
           )}
         </div>
      </div>

    </div>
    
    {/* Inject Profile Panel Overlay Component cleanly mapping hooks globally! */}
    <ProfilePanel isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    
    </>
  );
}
