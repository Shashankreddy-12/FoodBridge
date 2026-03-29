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
  const [showPwd, setShowPwd] = useState(false);
  
  // Validation States
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

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

  const validate = () => {
    const errors = {};
    if (!formData.name || formData.name.trim().length < 2)
      errors.name = 'Name must be at least 2 characters';
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = 'Please enter a valid email address';
    if (!formData.password || formData.password.length < 8)
      errors.password = 'Password must be at least 8 characters';
    if (!formData.phone || !/^\d{10}$/.test(formData.phone))
      errors.phone = 'Please enter a valid 10-digit phone number';
    return errors;
  };

  useEffect(() => {
    setFieldErrors(validate());
  }, [formData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setTouched({ ...touched, [e.target.name]: true });
  };

  const hasErrors = Object.keys(fieldErrors).length > 0;

  const handleRegister = async (e) => {
    e.preventDefault();
    if (hasErrors) return;
    
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

  const getPasswordStrength = (pwd) => {
    if (!pwd || pwd.length < 8) return { text: 'Too short', color: 'text-red-500' };
    const hasSpecialAndNum = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd) && /\d/.test(pwd);
    if (hasSpecialAndNum) return { text: 'Strong', color: 'text-green-600' };
    return { text: 'Medium', color: 'text-amber-500' };
  };

  const getFieldClass = (name) => {
    const base = "w-full px-3 py-2 mt-1 border rounded focus:ring-green-500 focus:outline-none transition-colors";
    if (touched[name] && fieldErrors[name]) return `${base} border-red-400 bg-red-50`;
    if (touched[name] && !fieldErrors[name]) return `${base} border-green-500 bg-green-50`;
    return base;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12 px-4 shadow-sm">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-3xl font-black text-center text-green-600 mb-6 tracking-tight">FoodBridge</h2>
        <p className="text-center text-gray-500 font-medium text-sm mb-6">Create your account to get started.</p>
        
        {error && <div className="mb-4 text-sm text-red-700 bg-red-50 p-3 rounded-lg font-bold border border-red-200 text-center">{error}</div>}
        
        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <div className="flex justify-between items-center text-sm font-bold text-gray-700 tracking-wide">
                <label>NAME</label> 
                {touched.name && !fieldErrors.name && <span className="text-green-500 font-bold">✓</span>}
            </div>
            <input type="text" name="name" className={getFieldClass('name')} onChange={handleChange} required />
            {touched.name && fieldErrors.name && <p className="text-xs text-red-500 mt-1 font-semibold">{fieldErrors.name}</p>}
          </div>
          <div>
            <div className="flex justify-between items-center text-sm font-bold text-gray-700 tracking-wide">
                <label>EMAIL</label> 
                {touched.email && !fieldErrors.email && <span className="text-green-500 font-bold">✓</span>}
            </div>
            <input type="email" name="email" className={getFieldClass('email')} onChange={handleChange} required />
            {touched.email && fieldErrors.email && <p className="text-xs text-red-500 mt-1 font-semibold">{fieldErrors.email}</p>}
          </div>
          <div>
            <div className="flex justify-between items-center text-sm font-bold text-gray-700 tracking-wide">
                <label>PASSWORD</label> 
                {touched.password && !fieldErrors.password && <span className="text-green-500 font-bold">✓</span>}
            </div>
            <div className="relative">
                <input type={showPwd ? "text" : "password"} name="password" className={getFieldClass('password') + " pr-10"} onChange={handleChange} required />
                <button 
                  type="button" 
                  onClick={() => setShowPwd(!showPwd)} 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 mt-1 text-gray-400 hover:text-green-600 focus:outline-none"
                  tabIndex="-1"
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
            </div>
            {touched.password && fieldErrors.password && <p className="text-xs text-red-500 mt-1 font-semibold">{fieldErrors.password}</p>}
            {touched.password && !fieldErrors.password && (
                 <p className={`text-xs mt-1 font-bold ${getPasswordStrength(formData.password).color}`}>
                     {getPasswordStrength(formData.password).text}
                 </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center text-sm font-bold text-gray-700 tracking-wide">
                <label>PHONE <span className="text-red-500">*</span></label> 
                {touched.phone && !fieldErrors.phone && <span className="text-green-500 font-bold">✓</span>}
            </div>
            <input type="text" name="phone" className={getFieldClass('phone')} onChange={handleChange} required />
            {touched.phone && fieldErrors.phone && <p className="text-xs text-red-500 mt-1 font-semibold">{fieldErrors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold tracking-wide text-gray-700 mb-1">ORGANIZATION (OPTIONAL)</label>
            <input type="text" name="orgName" className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-green-500 focus:outline-none" onChange={handleChange} />
          </div>
          
          <button type="submit" disabled={hasErrors} className="w-full py-3 px-4 mt-6 text-white text-lg bg-green-600 rounded-xl hover:bg-green-700 font-black shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:-translate-y-0.5">
            Register Let's Go
          </button>
        </form>
        <p className="mt-8 text-sm text-center text-gray-600 font-medium">
          Already have an account? <Link to="/login" className="text-green-600 hover:text-green-800 font-bold underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
