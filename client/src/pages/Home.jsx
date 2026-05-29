import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Services from '../components/Services';
import FeaturedMenu from '../components/FeaturedMenu';
import RoomsPreview from '../components/RoomsPreview';
import WhyChooseUs from '../components/WhyChooseUs';
import Footer from '../components/Footer';

const Home = ({ onNavigate }) => {
    useEffect(() => {
        const pendingSection = sessionStorage.getItem('pendingSection');
        if (!pendingSection) return;

        let attempts = 0;
        const maxAttempts = 10;
        const tryScroll = () => {
            const target = document.getElementById(pendingSection);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                sessionStorage.removeItem('pendingSection');
                return;
            }

            attempts += 1;
            if (attempts < maxAttempts) {
                window.setTimeout(tryScroll, 120);
            }
        };

        window.setTimeout(tryScroll, 100);
    }, []);

    return (
        <div className="min-h-screen text-gray-900 dark:text-gray-100">
            <Navbar onNavigate={onNavigate} />
            <Hero />
            <Services />
            <FeaturedMenu onNavigate={onNavigate} />
            <RoomsPreview onNavigate={onNavigate} />
            <WhyChooseUs />
            <Footer />
        </div>
    );
};

export default Home;

