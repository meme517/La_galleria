import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  'Welcome to La galleria',
  'Preparing your experience',
  'Setting up bookings & orders',
];

export const Loader = () => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Advance step every 3 seconds, hide after the last step
    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= steps.length - 1) {
          return prev;
        }
        return prev + 1;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#fff,_transparent_60%),radial-gradient(circle_at_bottom,_#000,_transparent_60%)]" />

      <div className="relative flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.8, 0.25, 1] }}
          className="mb-8"
        >
          <span className="inline-flex items-center justify-center rounded-full bg-white/10 backdrop-blur px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">
            Resto Bar Hotel Experience
          </span>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-lg"
        >
          <span className="block">La</span>
          <span className="block text-amber-200">galleria</span>
        </motion.h1>

        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="mt-6 text-base sm:text-lg text-amber-50 max-w-md"
          >
            {steps[stepIndex]}
          </motion.p>
        </AnimatePresence>

        <div className="mt-10 flex flex-col items-center space-y-4">
          <div className="relative h-1.5 w-56 overflow-hidden rounded-full bg-white/20">
            <motion.div
              key={stepIndex}
              initial={{ width: '0%' }}
              animate={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
              transition={{ duration: 2.4, ease: 'easeInOut' }}
              className="h-full rounded-full bg-gradient-to-r from-white via-amber-200 to-orange-100 shadow-[0_0_12px_rgba(255,255,255,0.6)]"
            />
          </div>

          <div className="flex space-x-2">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 w-2 rounded-full transition-all ${
                  idx <= stepIndex
                    ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                    : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


