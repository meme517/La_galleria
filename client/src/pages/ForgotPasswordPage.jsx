import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../services/config';

const ForgotPasswordPage = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    email: '',
    securityWord: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { t, language, setLanguage } = useLanguage();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('forgotPassword.mismatch', 'Passwords do not match'));
      return;
    }

    if (formData.newPassword.length < 6) {
      setError(t('forgotPassword.tooShort', 'Password must be at least 6 characters'));
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
        email: formData.email,
        securityWord: formData.securityWord,
        newPassword: formData.newPassword
      });
      setSuccess(response.data?.message || t('forgotPassword.success', 'Password updated successfully.'));
      setFormData({ email: '', securityWord: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || t('forgotPassword.failed', 'Could not reset your password'));
    } finally {
      setLoading(false);
    }
  };

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
            onClick={() => onNavigate('home')}
            className="text-orange-600 hover:text-orange-700 font-medium flex items-center justify-center mb-4 mx-auto"
          >
            ← {t('forgotPassword.backHome', 'Back to Home')}
          </button>
          <h2 className="text-3xl font-bold text-gray-900">
            {t('forgotPassword.title', 'Reset your password')}
          </h2>
          <p className="mt-2 text-gray-600">
            {t('forgotPassword.subtitle', 'Enter your email and the security word you chose when creating your account.')}
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

            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
              >
                {success}
              </motion.div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('forgotPassword.email', 'Email address')}
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
                placeholder={t('forgotPassword.emailPlaceholder', 'Enter your email')}
              />
            </div>

            <div>
              <label htmlFor="securityWord" className="block text-sm font-medium text-gray-700 mb-2">
                {t('forgotPassword.securityWord', 'Security word')}
              </label>
              <input
                id="securityWord"
                name="securityWord"
                type="text"
                autoComplete="off"
                required
                value={formData.securityWord}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                placeholder={t('forgotPassword.securityWordPlaceholder', 'Enter the word you chose at signup')}
              />
              <p className="mt-2 text-xs text-gray-500">
                {t('forgotPassword.securityWordHint', 'Your security word is not case sensitive.')}
              </p>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t('forgotPassword.newPassword', 'New password')}
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={formData.newPassword}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                placeholder={t('forgotPassword.newPasswordPlaceholder', 'Create a new password')}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t('forgotPassword.confirmPassword', 'Confirm new password')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={formData.confirmPassword}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                placeholder={t('forgotPassword.confirmPasswordPlaceholder', 'Confirm your new password')}
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
                  {t('forgotPassword.resetting', 'Updating password...')}
                </div>
              ) : (
                t('forgotPassword.submit', 'Reset password')
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-600 text-sm">
              {t('forgotPassword.remembered', 'Remembered your password?')}{' '}
              <button
                onClick={() => onNavigate('login')}
                className="font-medium text-orange-600 hover:text-orange-700 transition-colors"
              >
                {t('forgotPassword.signIn', 'Sign in')}
              </button>
            </p>
            <p className="text-gray-600 text-sm">
              {t('forgotPassword.noAccount', "Don't have an account?")}{' '}
              <button
                onClick={() => onNavigate('register')}
                className="font-medium text-orange-600 hover:text-orange-700 transition-colors"
              >
                {t('forgotPassword.createOne', 'Create one here')}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
