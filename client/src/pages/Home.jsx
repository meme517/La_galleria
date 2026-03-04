import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Services from '../components/Services';
import FeaturedMenu from '../components/FeaturedMenu';
import RoomsPreview from '../components/RoomsPreview';
import WhyChooseUs from '../components/WhyChooseUs';
import Footer from '../components/Footer';

const Home = ({ onNavigate }) => {
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

