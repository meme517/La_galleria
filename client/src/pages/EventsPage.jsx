import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import ScrollReveal from '../components/ScrollReveal';

const EventsPage = ({ onNavigate }) => {
  const { t } = useLanguage();
  const events = [
    {
      id: 1,
      title: 'Summer Music Festival',
      date: '2024-07-15',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
      description: 'Annual summer music festival featuring local bands and food vendors. A celebration of music, food, and community.',
      attendees: 500
    },
    {
      id: 2,
      title: 'Wine Tasting Evening',
      date: '2024-06-20',
      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=400&fit=crop',
      description: 'Exclusive wine tasting event with sommelier-led sessions, cheese pairings, and premium selection of wines from around the world.',
      attendees: 120
    },
    {
      id: 3,
      title: 'Corporate Gala Dinner',
      date: '2024-05-10',
      image: 'https://images.unsplash.com/photo-1519167758481-83f29da2dc9d?w=600&h=400&fit=crop',
      description: 'Elegant corporate gala featuring 5-course dinner, live entertainment, and networking opportunities for business professionals.',
      attendees: 250
    },
    {
      id: 4,
      title: 'Wedding Reception',
      date: '2024-04-28',
      image: 'https://images.unsplash.com/photo-1519167758481-83f29da2dc9d?w=600&h=400&fit=crop',
      description: 'Beautiful outdoor wedding reception with custom catering, live band, and stunning venue decorations.',
      attendees: 150
    },
    {
      id: 5,
      title: 'New Year\'s Eve Celebration',
      date: '2023-12-31',
      image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=600&h=400&fit=crop',
      description: 'Spectacular New Year\'s Eve party with DJ, champagne toast at midnight, and buffet dinner.',
      attendees: 300
    },
    {
      id: 6,
      title: 'Charity Fundraiser',
      date: '2023-11-18',
      image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&h=400&fit=crop',
      description: 'Annual charity fundraiser event with auction, dinner, and entertainment. All proceeds donated to local community causes.',
      attendees: 200
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onNavigate={onNavigate} />
      
      <div className="container mx-auto px-4 py-16">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('events.title', 'Past Events')}</h1>
            <p className="text-lg text-gray-600">
              A showcase of memorable events we've hosted at La galleria
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event, index) => (
            <ScrollReveal key={event.id} delay={index * 0.1}>
              <motion.div
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-300"
                whileHover={{ y: -8, scale: 1.02 }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <div className="relative h-64 overflow-hidden">
                  <motion.img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <span className="text-primary font-semibold text-sm">
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {event.description}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {event.attendees} attendees
                  </div>
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

export default EventsPage;



