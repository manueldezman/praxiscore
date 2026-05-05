import Navbar from '@/components/layout/Navbar';
import HeroSection from '@/components/hero/HeroSection';
import StatsBar from '@/components/landing/StatsBar';
import FeatureSection from '@/components/landing/FeatureSection';
import CapabilityGrid from '@/components/landing/CapabilityGrid';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <StatsBar />
      <FeatureSection />
      <CapabilityGrid />
      <FinalCTA />
      <Footer />
    </main>
  );
}
