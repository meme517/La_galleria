import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const LoginPage = ({ onNavigate }) => {
  const [step, setStep] = useState('role-selection'); // 'role-selection' or 'login'
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t, language, setLanguage } = useLanguage();

  const roles = [
    {
      id: 'customer',
      name: t('roles.customer', 'Customer'),
      description: t('roles.customerDesc', 'Book rooms, place orders, and enjoy our services'),
      icon: '👤'
    },
    {
      id: 'serviceProvider',
      name: t('roles.serviceProvider', 'Service Provider'),
      description: t('roles.serviceProviderDesc', 'Staff member for check-in, orders, and service'),
      icon: '👨‍💼'
    },
    {
      id: 'admin',
      name: t('roles.admin', 'Administrator'),
      description: t('roles.adminDesc', 'Full system access and management'),
      icon: '👑'
    }
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep('login');
  };

  const handleBackToRoles = () => {
    setStep('role-selection');
    setSelectedRole('');
    setFormData({ email: '', password: '' });
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

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        ...formData,
        role: selectedRole
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Role-based redirect
      switch (selectedRole) {
        case 'customer':
          onNavigate('home'); // Customer dashboard
          break;
        case 'serviceProvider':
          onNavigate('serviceProvider'); // Service provider dashboard
          break;
        case 'admin':
          onNavigate('admin'); // Admin dashboard
          break;
        default:
          onNavigate('home');
      }
    } catch (err) {
      setError(err.response?.data?.message || t('login.failed', 'Login failed'));
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
              {t('login.title', 'Welcome Back')}
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              {t('login.selectRole', 'Select your account type to continue')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((role) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: roles.indexOf(role) * 0.1 }}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-orange-200"
                onClick={() => handleRoleSelect(role.id)}
              >
                <div className="p-8 text-center">
                  <div className="text-5xl mb-4">{role.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {role.name}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {role.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600">
              {t('login.noAccount', "Don't have an account?")}{' '}
              <button
                onClick={() => onNavigate('register')}
                className="font-medium text-orange-600 hover:text-orange-700 transition-colors"
              >
                {t('login.createHere', 'Create one here')}
              </button>
            </p>
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
            ← {t('login.backToRoles', 'Back to account types')}
          </button>
          <h2 className="text-3xl font-bold text-gray-900">
            {t('login.signInAs', 'Sign in as {{role}}', { role: roles.find(r => r.id === selectedRole)?.name })}
          </h2>
          <p className="mt-2 text-gray-600">
            {t('login.enterCredentials', 'Enter your credentials to continue')}
          </p>
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('login.email', 'Email address')}
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
                placeholder={t('login.emailPlaceholder', 'Enter your email')}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('login.password', 'Password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                placeholder={t('login.passwordPlaceholder', 'Enter your password')}
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
                  {t('login.signingIn', 'Signing in...')}
                </div>
              ) : (
                t('login.submit', 'Sign in')
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              {t('login.noAccount', "Don't have an account?")}{' '}
              <button
                onClick={() => onNavigate('register')}
                className="font-medium text-orange-600 hover:text-orange-700 transition-colors"
              >
                {t('login.createHere', 'Create one here')}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;


