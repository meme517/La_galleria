import ScrollReveal from './ScrollReveal';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const FeaturedMenu = ({ onNavigate }) => {
  const { t } = useLanguage();

  const menuItems = [
    {
      id: 1,
      name: 'Grilled Salmon',
      price: '$24.99',
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
      description: 'Fresh Atlantic salmon with herbs',
    },
    {
      id: 2,
      name: 'Beef Steak',
      price: '$28.99',
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
      description: 'Premium cut with roasted vegetables',
    },
    {
      id: 3,
      name: 'Pasta Carbonara',
      price: '$18.99',
      image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop',
      description: 'Creamy pasta with bacon and parmesan',
    },
    {
      id: 4,
      name: 'Caesar Salad',
      price: '$14.99',
      image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
      description: 'Fresh romaine with homemade dressing',
    },
    {
      id: 5,
      name: 'Chicken Curry',
      price: '$19.99',
      image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop',
      description: 'Spiced curry with basmati rice',
    },
    {
      id: 6,
      name: 'Chocolate Cake',
      price: '$12.99',
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
      description: 'Rich chocolate with vanilla ice cream',
    },
  ];

  return (
    <section id="menu" className="py-20 sm:py-24 lg:py-32 bg-gradient-to-b from-transparent to-cyan-50/30 dark:to-cyan-950/20">
      <div className="brand-container">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="brand-chip mb-4">Chef Selection</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t('menu.featured', 'Featured Menu')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('menu.featuredDesc', "Discover our chef's special selections")}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {menuItems.map((item, index) => (
            <ScrollReveal key={item.id} delay={index * 0.1}>
              <motion.div
                className="brand-card rounded-2xl overflow-hidden transition-shadow duration-300"
                whileHover={{ y: -8, scale: 1.02 }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <motion.img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                  />
                  <div className="absolute top-4 right-4 bg-slate-900/75 text-cyan-200 border border-cyan-300/40 px-3 py-1 rounded-full font-semibold text-sm backdrop-blur-sm dark:bg-slate-800/80">
                    {item.price}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {item.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {item.description}
                  </p>
                  <motion.button
                    onClick={() => {
                      const token = localStorage.getItem('token');
                      const storedUser = localStorage.getItem('user');

                      if (!token || !storedUser) {
                        alert(t('orders.loginCustomer', 'Please log in as a customer to place an order.'));
                        if (onNavigate) onNavigate('login');
                        return;
                      }

                      try {
                        const userData = JSON.parse(storedUser);
                        if (userData.role !== 'customer') {
                          alert(t('orders.onlyCustomer', 'Only customers can place orders. Please log in with a customer account.'));
                          if (onNavigate) onNavigate('login');
                          return;
                        }

                        if (onNavigate) {
                          sessionStorage.setItem('selectedMenuItem', JSON.stringify(item));
                          onNavigate('orders');
                        }
                      } catch (err) {
                        console.error('Error checking user role:', err);
                        alert(t('orders.login', 'Please log in to place an order.'));
                        if (onNavigate) onNavigate('login');
                      }
                    }}
                    className="w-full brand-button rounded-lg py-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {t('orders.orderNow', 'Order Now')}
                  </motion.button>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.3}>
          <div className="text-center mt-12">
            <motion.a
              href="#menu"
              className="brand-button rounded-lg"
              whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(217, 119, 6, 0.3)' }}
              whileTap={{ scale: 0.95 }}
            >
              {t('menu.viewFull', 'View Full Menu')}
            </motion.a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default FeaturedMenu;
