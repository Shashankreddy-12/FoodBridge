import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FoodMap from '../components/FoodMap';
import ListingCard from '../components/ListingCard';
import SafetyBadge from '../components/SafetyBadge';
import api from '../utils/api';
import { useNotificationStore } from '../store/notifications';
import { useAuthStore } from '../store/store';

export default function Feed() {
    const [userLocation, setUserLocation] = useState(null);
    const [locError, setLocError] = useState(null);
    
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState(null);
    
    const [foodTypeFilter, setFoodTypeFilter] = useState('All');
    const [urgencyFilter, setUrgencyFilter] = useState('All');
    
    const [selectedListing, setSelectedListing] = useState(null);
    const [claimingId, setClaimingId] = useState(null);
    const [toast, setToast] = useState(null);

    const token = useAuthStore(s => s.token);
    const navigate = useNavigate();

    // Bind real-time notifications to feed
    const notifications = useNotificationStore(s => s.notifications);
    const volunteerLocation = useNotificationStore(s => s.volunteerLocation);

    const requestLocation = () => {
        setLocError(null);
        setApiError(null);
        setLoading(true);

        if (!("geolocation" in navigator)) {
            setLocError("Location access denied. Please enable it in browser settings.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            (err) => {
                if (err.code === err.PERMISSION_DENIED) setLocError("Location access denied. Please enable it in browser settings.");
                else if (err.code === err.TIMEOUT) setLocError("Location request timed out. Please try again.");
                else setLocError("Location unavailable. Please try again.");
                setLoading(false);
            },
            { timeout: 10000 }
        );
    };

    const fetchListings = async () => {
        if (!userLocation) return;
        setLoading(true);
        setApiError(null);

        try {
            const res = await api.get(`/api/listings?lat=${userLocation.lat}&lng=${userLocation.lng}`);
            setListings(res.data);
        } catch (err) {
            console.error(err);
            setApiError("Unable to load listings. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // On Mount
    useEffect(() => {
        requestLocation();
    }, []);

    // When Location Arrives
    useEffect(() => {
        if (userLocation) fetchListings();
    }, [userLocation]);

    // Handle incoming real-time socket events
    useEffect(() => {
        if (notifications.length > 0) {
            const latest = notifications[0];
            
            // Handle real-time removal based on titles dispatched by hooks/useSocket.js
            if (latest.title === 'Your listing was claimed!') {
                setListings(prev => prev.filter(l => l._id !== latest.listingId));
                if (selectedListing && selectedListing._id === latest.listingId) {
                    setSelectedListing(null);
                }
            } else if (latest.title === 'A listing is available again') {
                // Future enhancement: could attempt to fetch and inject
            } else if (latest.title === 'Safety Score Updated') {
                // Native background AI update interceptor
                setListings(prev => prev.map(l => 
                    l._id === latest.listingId 
                        ? { ...l, safetyScore: latest.safetyScore } 
                        : l
                ));
                if (selectedListing && selectedListing._id === latest.listingId) {
                    setSelectedListing(prev => ({ ...prev, safetyScore: latest.safetyScore }));
                }
            } else if (!latest.title || latest.title === 'Pickup needed nearby!' || !latest.listingId) {
                // Normal listings logic
                setListings(prev => {
                    if (!prev.find(l => l._id === latest._id)) {
                        const combined = [...prev, latest];
                        return combined.sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));
                    }
                    return prev;
                });
            }
        }
    }, [notifications]);

    // Auto-select listing parameter
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const lId = queryParams.get('listing');
        if (lId && listings.length > 0) {
            const tgt = listings.find(l => l._id === lId);
            if (tgt) setSelectedListing(tgt);
        }
    }, [window.location.search, listings]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleClaim = async (listingId) => {
        if (!token) {
            navigate('/login');
            return;
        }
        try {
            setClaimingId(listingId); 
            await api.post(`/api/listings/${listingId}/claim`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Remove claimed listing from local feed state immediately
            setListings(prev => prev.filter(l => l._id !== listingId));
            setSelectedListing(null);
            showToast('Food claimed successfully! 🎉');
        } catch (err) {
            if (err.response?.status === 409) {
                showToast('Sorry, this was just claimed by someone else.', 'error');
                // Remove it from feed since it's no longer available
                setListings(prev => prev.filter(l => l._id !== listingId));
                setSelectedListing(null);
            } else if (err.response?.status === 401) {
                navigate('/login');
            } else {
                showToast('Failed to claim. Please try again.', 'error');
            }
        } finally {
            setClaimingId(null);
        }
    };


    // Filters
    const filteredListings = listings.filter(l => {
        if (foodTypeFilter !== 'All' && l.foodType !== foodTypeFilter) return false;
        if (urgencyFilter === 'Urgent only' && !l.urgent) return false;
        return true;
    });

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden relative">
            
            {/* Native Toast overlay */}
            {toast && (
                <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded shadow-lg z-[999999] text-white font-medium ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Header / Nav area placeholder (if standalone, otherwise wrapped in App Nav) */}
            <div className="bg-white border-b px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-sm shrink-0">
                <h1 className="text-2xl font-bold tracking-tight text-green-700">Live Food Feed</h1>
                
                <div className="flex space-x-3 mt-4 md:mt-0">
                    <select 
                        title="Food Type Filter"
                        value={foodTypeFilter} 
                        onChange={e => setFoodTypeFilter(e.target.value)}
                        className="border-gray-300 border text-sm rounded px-3 py-1.5 bg-white text-gray-700"
                    >
                        <option value="All">All Types</option>
                        <option value="cooked">Cooked</option>
                        <option value="raw">Raw</option>
                        <option value="packaged">Packaged</option>
                        <option value="bakery">Bakery</option>
                        <option value="produce">Produce</option>
                        <option value="dairy">Dairy</option>
                        <option value="other">Other</option>
                    </select>
                    
                    <select 
                        title="Urgency Filter"
                        value={urgencyFilter} 
                        onChange={e => setUrgencyFilter(e.target.value)}
                        className="border-gray-300 border text-sm rounded px-3 py-1.5 bg-white text-gray-700"
                    >
                        <option value="All">All Urgency</option>
                        <option value="Urgent only">Urgent Only</option>
                    </select>
                </div>
            </div>

            {/* Error States */}
            {locError && (
                <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex flex-col items-center">
                    <p className="mb-3 font-medium text-center">{locError}</p>
                    <button onClick={requestLocation} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">Retry Location</button>
                </div>
            )}
            
            {apiError && !locError && (
                <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex flex-col items-center">
                    <p className="mb-3 font-medium text-center">{apiError}</p>
                    <button onClick={fetchListings} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">Retry Fetch</button>
                </div>
            )}

            {/* Main Content */}
            {!locError && !apiError && (
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* Left Panel: Scrollable List */}
                    <div className="w-full md:w-[40%] bg-gray-50 p-4 overflow-y-auto border-r border-gray-200">
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="animate-pulse bg-white p-4 h-32 rounded-lg border border-gray-100 shadow-sm">
                                        <div className="bg-gray-200 h-4 w-1/2 rounded mb-4"></div>
                                        <div className="bg-gray-200 h-3 w-1/4 rounded mb-2"></div>
                                        <div className="bg-gray-200 h-3 w-full rounded mt-6"></div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredListings.length === 0 ? (
                            <div className="text-center py-10 bg-white rounded shadow-sm border border-gray-100">
                                <p className="text-gray-500">No matching listings nearby.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 pb-20 md:pb-0">
                                {filteredListings.map(listing => (
                                    <ListingCard 
                                        key={listing._id} 
                                        listing={listing} 
                                        onSelect={setSelectedListing} 
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Right Panel: Map Wrapper */}
                    <div className="hidden md:block w-[60%] h-full bg-gray-200 relative">
                        <FoodMap 
                            listings={filteredListings} 
                            userLocation={userLocation} 
                            onSelectListing={setSelectedListing} 
                            volunteerLocation={volunteerLocation}
                        />
                    </div>
                </div>
            )}

            {/* Slide-in Details Modal Overlay (Phase 4 placeholder binding) */}
            {selectedListing && (
                <div className="fixed inset-0 bg-black/50 z-[99999] flex items-center justify-center sm:justify-end sm:items-stretch overflow-hidden">
                    <div className="bg-white w-full h-full sm:h-auto sm:w-[500px] shadow-2xl flex flex-col transform transition-transform duration-300">
                        
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50 shrink-0">
                            <h2 className="text-xl font-bold text-gray-800 break-words pr-4">{selectedListing.title}</h2>
                            <button onClick={() => setSelectedListing(null)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="flex items-center space-x-3 mb-6">
                                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full capitalize">{selectedListing.foodType}</span>
                                <SafetyBadge score={selectedListing.safetyScore} />
                            </div>
                            
                            <div className="space-y-5">
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Donor</p>
                                    <p className="text-base text-gray-800 font-medium">
                                        {selectedListing.donor.name} 
                                        {selectedListing.donor.orgName && <span className="text-gray-500 font-normal ml-2">({selectedListing.donor.orgName})</span>}
                                    </p>
                                </div>
                                
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Quantity</p>
                                    <p className="text-base text-gray-800">{selectedListing.quantity}</p>
                                </div>
                                
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Condition</p>
                                    <p className="text-base text-gray-800 whitespace-pre-line bg-gray-50 p-3 rounded border border-gray-100">{selectedListing.condition}</p>
                                </div>
                                
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Address</p>
                                    <p className="text-base text-gray-800">{selectedListing.address}</p>
                                </div>
                                
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Expires</p>
                                    <p className="text-base text-red-600 font-bold">
                                        {new Date(selectedListing.expiresAt).toLocaleString(undefined, {
                                            weekday: 'short', month: 'short', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 border-t bg-gray-50 shrink-0">
                            <button 
                                disabled={claimingId === selectedListing._id}
                                onClick={() => handleClaim(selectedListing._id)}
                                className="w-full py-3 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {claimingId === selectedListing._id ? 'Claiming...' : 'Claim This Food'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
