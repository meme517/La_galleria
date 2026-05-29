import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const RegisterPage = ({ onNavigate }) => {
  const [step, setStep] = useState('role-selection'); // 'role-selection', 'register', or 'service-provider-info'
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t, language, setLanguage } = useLanguage();

  const roles = [
    {
      id: 'customer',
      name: t('roles.customer', 'Customer'),
      description: t('roles.customerDesc', 'Book rooms, place orders, and enjoy our services'),
      icon: '👤',
      canRegister: true
    },
    {
      id: 'serviceProvider',
      name: t('roles.serviceProvider', 'Service Provider'),
      description: t('roles.serviceProviderDesc', 'Staff member for attendance, orders, and service'),
      icon: '👨‍💼',
      canRegister: false
    },
    {
      id: 'admin',
      name: t('roles.admin', 'Administrator'),
      description: t('roles.adminDesc', 'Full system access and management'),
      icon: '👑',
      canRegister: true,
      warning: t('roles.adminWarning', 'Admins have full system access')
    }
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === 'serviceProvider') {
      setStep('service-provider-info');
    } else {
      setStep('register');
    }
  };

  const handleBackToRoles = () => {
    setStep('role-selection');
    setSelectedRole('');
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setError('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: selectedRole
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Role-based redirect
      switch (selectedRole) {
        case 'customer':
          onNavigate('home'); // Customer dashboard
          break;
        case 'admin':
          onNavigate('admin'); // Admin dashboard
          break;
        default:
          onNavigate('home');
      }
    } catch (err) {
      setError(err.response?.data?.message || t('register.failed', 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  if (step === 'role-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="sm:mx-auto sm:w-full sm:max-w-2xl"
        >
          <div className="flex justify-end mb-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-2 py-1 rounded-lg text-sm bg-white border border-orange-200 text-gray-800"
              aria-label="Language"
              title="Language"
            >
              <option value="en">{t('lang.english', 'English')}</option>
              <option value="rw">{t('lang.kinyarwanda', 'Kinyarwanda')}</option>
            </select>
          </div>
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              {t('register.title', 'Create your account')}
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              {t('register.selectRole', 'Select your account type to get started')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((role) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: roles.indexOf(role) * 0.1 }}
                className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 ${
                  role.canRegister
                    ? 'border-transparent hover:border-orange-200'
                    : 'border-gray-200 opacity-75'
                }`}
                onClick={() => role.canRegister && handleRoleSelect(role.id)}
              >
                <div className="p-8 text-center">
                  <div className="text-5xl mb-4">{role.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {role.name}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {role.description}
                  </p>
                  {role.warning && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg text-xs">
                      ⚠️ {role.warning}
                    </div>
                  )}
                  {!role.canRegister && (
                    <div className="bg-gray-50 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-xs">
                      Account created by Admin
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600">
              {t('register.haveAccount', 'Already have an account?')}{' '}
              <button
                onClick={() => onNavigate('login')}
                className="font-medium text-orange-600 hover:text-orange-700 transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === 'service-provider-info') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="text-center mb-8">
            <button
              onClick={handleBackToRoles}
              className="text-orange-600 hover:text-orange-700 font-medium flex items-center justify-center mb-4"
            >
              ← Back to account types
            </button>
            <div className="text-5xl mb-4">👨‍💼</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Service Provider Registration
            </h2>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-100 text-center">
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">Service Provider Accounts</h3>
                <p className="text-sm">
                  Service Provider accounts are created by Administrators only.
                  Please contact your system administrator to create your account.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleBackToRoles}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Choose Different Account Type
              </button>

              <button
                onClick={() => onNavigate('login')}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Sign In Instead
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-end mb-4">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-2 py-1 rounded-lg text-sm bg-white border border-orange-200 text-gray-800"
            aria-label="Language"
            title="Language"
          >
            <option value="en">{t('lang.english', 'English')}</option>
            <option value="rw">{t('lang.kinyarwanda', 'Kinyarwanda')}</option>
          </select>
        </div>
        <div className="text-center mb-8">
          <button
            onClick={handleBackToRoles}
            className="text-orange-600 hover:text-orange-700 font-medium flex items-center justify-center mb-4"
          >
            ← Back to account types
          </button>
          <h2 className="text-3xl font-bold text-gray-900">
            Create {roles.find(r => r.id === selectedRole)?.name} Account
          </h2>
          <p className="mt-2 text-gray-600">
            Fill in your details to get started
          </p>
          {selectedRole === 'admin' && (
            <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
              ⚠️ {roles.find(r => r.id === 'admin')?.warning}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                placeholder="Create a password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              {t('register.haveAccount', 'Already have an account?')}{' '}
              <button
                onClick={() => onNavigate('login')}
                className="font-medium text-orange-600 hover:text-orange-700 transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;



