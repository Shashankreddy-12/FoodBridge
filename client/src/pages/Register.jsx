import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import api from '../utils/api';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', orgName: ''
  });
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [error, setError] = useState('');
  const setAuth = useAuthStore(s => s.setAuth);
  const navigate = useNavigate();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log('Location access denied or failed')
      );
    }
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(formData.phone)) {
        setError('Please enter a valid 10-digit phone number');
        return;
    }
    setError('');
    try {
      const payload = { ...formData, ...location };
      const res = await api.post('/api/auth/register', payload);
      setAuth(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h2 className="text-3xl font-bold text-center text-green-600 mb-6">Register</h2>
        {error && <p className="mb-4 text-sm text-red-500 text-center">{error}</p>}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" name="name" className="w-full px-3 py-2 mt-1 border rounded focus:ring-green-500" onChange={handleChange} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" className="w-full px-3 py-2 mt-1 border rounded focus:ring-green-500" onChange={handleChange} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" name="password" className="w-full px-3 py-2 mt-1 border rounded focus:ring-green-500" onChange={handleChange} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone <span className="text-red-500">*</span></label>
            <input type="text" name="phone" className="w-full px-3 py-2 mt-1 border rounded focus:ring-green-500" onChange={handleChange} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Organization Name (Optional)</label>
            <input type="text" name="orgName" className="w-full px-3 py-2 mt-1 border rounded focus:ring-green-500" onChange={handleChange} />
          </div>
          
          <button type="submit" className="w-full py-2 px-4 mt-4 text-white bg-green-600 rounded hover:bg-green-700">
            Register Let's Go
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account? <Link to="/login" className="text-green-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
