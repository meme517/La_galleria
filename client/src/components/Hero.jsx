import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const Hero = () => {
  const { t } = useLanguage();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.25, 0, 1],
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.25, 0, 1],
      },
    },
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
    >
      <div className="absolute -top-36 -left-24 h-[28rem] w-[28rem] bg-cyan-300/25 blur-3xl dark:bg-cyan-500/25" />
      <div className="absolute -bottom-32 -right-20 h-[26rem] w-[26rem] bg-pink-300/20 blur-3xl dark:bg-pink-500/20" />

      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="brand-container relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-5xl mx-auto brand-card rounded-3xl px-6 py-12 sm:px-10 sm:py-16"
        >
          <motion.div variants={itemVariants} className="brand-chip mb-6">
            Signature Experience
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight"
          >
            <span className="block">{t('hero.title', 'Eat Well. Drink Fresh. Rest Comfortably.')}</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-teal-500 to-pink-500 dark:from-cyan-300 dark:via-teal-200 dark:to-pink-300">
              Kigali’s most complete hospitality destination
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            {t('hero.subtitle', 'Experience the perfect blend of culinary excellence, refreshing beverages, and comfortable accommodations. Your one-stop destination for dining, drinks, and rest.')}
          </motion.p>

          <motion.div
            variants={buttonVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
          >
            <motion.a
              href="#menu"
              className="brand-button rounded-xl text-lg"
              whileHover={{ 
                scale: 1.05, 
                boxShadow: '0 15px 35px rgba(217, 119, 6, 0.4)',
                y: -2
              }}
              whileTap={{ scale: 0.95 }}
            >
              {t('hero.viewMenu', 'View Menu')}
            </motion.a>
            <motion.a
              href="#rooms"
              className="px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg border border-cyan-300/60 dark:border-cyan-300/30 text-cyan-700 dark:text-cyan-200 bg-white/80 dark:bg-slate-900/80 hover:bg-cyan-600 hover:text-white dark:hover:bg-cyan-500"
              whileHover={{ 
                scale: 1.05,
                boxShadow: '0 15px 35px rgba(217, 119, 6, 0.3)',
                y: -2
              }}
              whileTap={{ scale: 0.95 }}
            >
              {t('hero.bookRoom', 'Book a Room')}
            </motion.a>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-3 bg-gray-400 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
