import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/store';
import SafetyBadge from '../components/SafetyBadge';
import Navbar from '../components/Navbar';

export default function PostListing() {
    const [formData, setFormData] = useState({
        title: '',
        foodType: 'cooked',
        quantity: '',
        expiresAt: '',
        condition: '',
        address: ''
    });
    const [location, setLocation] = useState({ lat: null, lng: null });
    const [locStatus, setLocStatus] = useState('Capturing location...');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    
    const [safetyPrecheck, setSafetyPrecheck] = useState(null);
    const [checkingSafety, setCheckingSafety] = useState(false);

    const [autoFilled, setAutoFilled] = useState(false);
    
    const navigate = useNavigate();
    const token = useAuthStore(s => s.token);
    const setAuth = useAuthStore(s => s.setAuth);
    const user = useAuthStore(s => s.user);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setLocation({ lat, lng });
                    setLocStatus('Location captured ✓');
                    
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lng=${lng}&format=json`);
                        const data = await response.json();
                        if (data.display_name) {
                            setFormData(prev => ({ ...prev, address: data.display_name }));
                            setAutoFilled(true);
                        }
                    } catch (err) {
                        console.error("Geocoding failed", err);
                    }
                },
                (err) => setLocStatus('Location access denied or failed ✗')
            );
        } else {
            setLocStatus('Geolocation not supported');
        }
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (safetyPrecheck?.blocked) {
            setError('This listing cannot be posted due to food safety concerns.');
            return;
        }

        setError('');
        setSubmitting(true);

        try {
            const payload = { ...formData, ...location };
            await api.post('/api/listings', payload, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Update user role in frontend store manually if needed
            if (user && user.role !== 'donor') {
                const updatedUser = { ...user, role: 'donor' };
                setAuth(updatedUser, token);
            }

            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to post listing');
            setSubmitting(false);
        }
    };

    const handleSafetyCheck = async () => {
        if (!formData.title || !formData.condition) {
            setError('Please describe the food and condition first.');
            return;
        }
        setCheckingSafety(true);
        setError('');
        try {
            const res = await api.post('/api/listings/safety-check', {
                description: formData.title,
                condition: formData.condition,
                foodType: formData.foodType
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSafetyPrecheck(res.data.badge);
        } catch (err) {
            setSafetyPrecheck({ color: 'amber', label: 'Use caution', icon: 'warning', blocked: false, reason: 'AI Check unavailable' });
        } finally {
            setCheckingSafety(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12 px-4 pt-24">
                <div className="w-full max-w-xl p-8 bg-white rounded shadow-md">
                <h2 className="text-3xl font-bold text-center text-green-600 mb-6">Post Food Listing</h2>
                {error && <p className="mb-4 text-sm text-red-500 text-center">{error}</p>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                        <input type="text" name="title" className="w-full px-3 py-2 mt-1 border rounded focus:ring-green-500 text-sm" onChange={handleChange} required />
                    </div>

                    <div className="flex space-x-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">Food Type <span className="text-red-500">*</span></label>
                            <select name="foodType" className="w-full px-3 py-2 mt-1 border rounded focus:ring-green-500 bg-white text-sm" onChange={handleChange} value={formData.foodType}>
                                <option value="cooked">Cooked</option>
                                <option value="raw">Raw</option>
                                <option value="packaged">Packaged</option>
                                <option value="bakery">Bakery</option>
                                <option value="produce">Produce</option>
                                <option value="dairy">Dairy</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">Quantity <span className="text-red-500">*</span></label>
                            <input type="text" name="quantity" placeholder="e.g. 5 kg, 20 meals" className="w-full px-3 py-2 mt-1 border rounded focus:ring-green-500 text-sm" onChange={handleChange} required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Expiry Date & Time <span className="text-red-500">*</span></label>
                        <input type="datetime-local" name="expiresAt" className="w-full px-3 py-2 mt-1 border rounded focus:ring-green-500 text-sm" onChange={handleChange} required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Address <span className="text-red-500">*</span></label>
                        <input type="text" name="address" placeholder="Physical street address..." className="w-full px-3 py-2 mt-1 border rounded focus:ring-green-500 text-sm" onChange={handleChange} value={formData.address} required />
                        {autoFilled && <p className="text-xs text-green-600 mt-1 font-semibold">📍 Address auto-filled from GPS. You can edit it.</p>}
                    </div>

                    <div className="flex space-x-2">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">Condition Description <span className="text-red-500">*</span></label>
                            <textarea name="condition" placeholder="Describe the food condition..." className="w-full px-3 py-2 mt-1 border rounded focus:ring-green-500 text-sm" rows="3" onChange={handleChange} required></textarea>
                        </div>
                        <div className="flex items-end mb-1">
                            <button 
                                type="button"
                                disabled={checkingSafety}
                                onClick={handleSafetyCheck} 
                                className="px-3 py-2 bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100 text-sm font-semibold whitespace-nowrap transition disabled:opacity-50"
                            >
                                {checkingSafety ? 'Checking...' : 'Check Food Safety'}
                            </button>
                        </div>
                    </div>

                    {safetyPrecheck && (
                        <div className={`p-4 rounded-md border ${safetyPrecheck.blocked ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                           <div className="flex items-center space-x-3 mb-1">
                               <SafetyBadge score={safetyPrecheck.score || safetyPrecheck.verdict === 'Safe' ? 85 : (safetyPrecheck.verdict === 'Caution' ? 50 : 10)} />
                               {safetyPrecheck.blocked && <span className="text-sm text-red-600 font-bold">This food cannot be listed due to safety concerns</span>}
                           </div>
                           {safetyPrecheck.suggestedAction && !safetyPrecheck.blocked && (
                               <p className="text-sm text-gray-600 mt-2"><strong>AI Advice:</strong> {safetyPrecheck.suggestedAction}</p>
                           )}
                           {safetyPrecheck.blocked && safetyPrecheck.reason && (
                               <p className="text-sm text-red-600 mt-1"><strong>Reason:</strong> {safetyPrecheck.reason}</p>
                           )}
                        </div>
                    )}

                    <div className="text-sm pt-4 border-t">
                        <span className="font-medium text-gray-700">GPS Location: </span>
                        <span className={location.lat ? "text-green-600 font-semibold" : "text-gray-500 italic"}>
                            {locStatus}
                        </span>
                    </div>

                    <button disabled={submitting || safetyPrecheck?.blocked} type="submit" className="w-full py-2 px-4 mt-6 text-white bg-green-600 rounded font-bold hover:bg-green-700 transition duration-150 ease-in-out disabled:opacity-50 disabled:bg-gray-400">
                        {submitting ? 'Posting...' : 'Post Listing'}
                    </button>
                </form>
            </div>
        </div>
        </>
    );
}
