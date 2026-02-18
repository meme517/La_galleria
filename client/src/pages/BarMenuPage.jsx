import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import ScrollReveal from '../components/ScrollReveal';

const BarMenuPage = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [barItems, setBarItems] = useState([
    {
      id: 1,
      name: 'Classic Mojito',
      category: 'cocktails',
      price: '$12.99',
      image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=300&fit=crop',
      description: 'Fresh mint, lime, rum, and soda water'
    },
    {
      id: 2,
      name: 'Old Fashioned',
      category: 'cocktails',
      price: '$14.99',
      image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop',
      description: 'Bourbon, sugar, bitters, and orange peel'
    },
    {
      id: 3,
      name: 'Wine Selection',
      category: 'wine',
      price: '$8.99 - $25.99',
      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop',
      description: 'Red, white, and sparkling wines available'
    },
    {
      id: 4,
      name: 'Craft Beer Flight',
      category: 'beer',
      price: '$16.99',
      image: 'https://images.unsplash.com/photo-1584384689201-e3bc829f5e93?w=400&h=300&fit=crop',
      description: 'Selection of 4 local craft beers'
    },
    {
      id: 5,
      name: 'Premium Whiskey',
      category: 'spirits',
      price: '$18.99 - $45.99',
      image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=300&fit=crop',
      description: 'Fine selection of single malt and blended whiskeys'
    },
    {
      id: 6,
      name: 'Tropical Paradise',
      category: 'cocktails',
      price: '$13.99',
      image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=300&fit=crop',
      description: 'Rum, coconut, pineapple, and tropical fruits'
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'cocktails', 'wine', 'beer', 'spirits'];

  const filteredItems = selectedCategory === 'all'
    ? barItems
    : barItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <Navbar onNavigate={onNavigate} />
      
      <div className="container mx-auto px-4 py-16">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('bar.title', 'Bar Menu')}</h1>
            <p className="text-lg text-gray-600">
              Enjoy our carefully curated selection of drinks and spirits
            </p>
          </div>
        </ScrollReveal>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item, index) => (
            <ScrollReveal key={item.id} delay={index * 0.1}>
              <motion.div
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-300"
                whileHover={{ y: -8, scale: 1.02 }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <div className="relative h-48 overflow-hidden">
                  <motion.img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                  />
                  <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full font-semibold text-sm">
                    {item.price}
                  </div>
                </div>
                <div className="p-6 flex flex-col space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {item.name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {item.description}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const token = localStorage.getItem('token');
                      const storedUser = localStorage.getItem('user');

                      if (!token || !storedUser) {
                        alert('Please log in as a customer to place an order.');
                        if (onNavigate) onNavigate('login');
                        return;
                      }

                      try {
                        const userData = JSON.parse(storedUser);
                        if (userData.role !== 'customer') {
                          alert('Only customers can place orders. Please log in with a customer account.');
                          if (onNavigate) onNavigate('login');
                          return;
                        }

                        if (onNavigate) {
                          sessionStorage.setItem('selectedMenuItem', JSON.stringify(item));
                          onNavigate('orders');
                        }
                      } catch (err) {
                        console.error('Error checking user role:', err);
                        alert('Please log in to place an order.');
                        if (onNavigate) onNavigate('login');
                      }
                    }}
                    className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors text-sm"
                  >
                    Order this drink
                  </button>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BarMenuPage;


