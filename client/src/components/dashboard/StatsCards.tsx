import React from 'react';
import { motion } from 'framer-motion';
import {
  CalendarIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { Stats } from '../../types';

interface StatsCardsProps {
  stats: Stats;
  onCardClick?: (type: 'bookings' | 'orders' | 'users') => void;
}

const keyToTypeMap = {
  activeBookings: 'bookings' as const,
  ordersToday: 'orders' as const,
  totalUsers: 'users' as const,
};

const statsConfig = [
  {
    key: 'activeBookings' as const,
    label: 'Active Bookings',
    icon: CalendarIcon,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    hoverColor: 'hover:border-blue-400',
  },
  {
    key: 'ordersToday' as const,
    label: 'Orders Today',
    icon: ClipboardDocumentListIcon,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-300',
    hoverColor: 'hover:border-emerald-400',
  },
  {
    key: 'totalUsers' as const,
    label: 'Total Users',
    icon: UsersIcon,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    hoverColor: 'hover:border-purple-400',
  },
];

export function StatsCards({ stats, onCardClick }: StatsCardsProps) {
  const getValue = (key: keyof Stats) => {
    switch (key) {
      case 'activeBookings':
        return stats.activeBookings;
      case 'ordersToday':
        return stats.ordersToday;
      case 'totalUsers':
        return stats.totalUsers;
      default:
        return 0;
    }
  };

  const cardValues = statsConfig.map((config) => Number(getValue(config.key)) || 0);
  const maxCardValue = Math.max(...cardValues, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8"
    >
      {statsConfig.map((config, index) => {
        const Icon = config.icon;
        const value = Number(getValue(config.key)) || 0;

        return (
          <motion.div
            key={config.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className={`bg-white/90 dark:bg-gray-900/70 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border ${config.borderColor} ${config.hoverColor} dark:border-gray-800 backdrop-blur`}
            onClick={() => onCardClick?.(keyToTypeMap[config.key])}
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">{config.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{value}</p>
                  <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${config.color.replace('text-', 'bg-')} transition-all duration-500`}
                      style={{ width: `${Math.max((value / maxCardValue) * 100, 2)}%` }}
                    ></div>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${config.bgColor}`}>
                  <Icon className={`h-8 w-8 ${config.color}`} />
                </div>
              </div>

              <div className="mt-4 flex items-center">
                {(() => {
                  const trend = stats.trends[config.key];
                  const isPositive = trend.direction === 'up';
                  const isNegative = trend.direction === 'down';
                  const colorClass = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600';
                  const arrow = isPositive ? 'up' : isNegative ? 'down' : 'flat';

                  return (
                    <>
                      <span className={`${colorClass} text-sm font-medium`}>
                        {arrow} {trend.percentage.toFixed(1)}%
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">{trend.comparison}</span>
                    </>
                  );
                })()}
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
