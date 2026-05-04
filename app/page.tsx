import Navbar from '@/components/layout/Navbar';
import HeroSection from '@/components/hero/HeroSection';
import FeaturedOn from '@/components/landing/FeaturedOn';
import StatsBar from '@/components/landing/StatsBar';
import FeatureSection from '@/components/landing/FeatureSection';
import CapabilityGrid from '@/components/landing/CapabilityGrid';
import Testimonials from '@/components/landing/Testimonials';
import PresetRules from '@/components/landing/PresetRules';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <FeaturedOn />
      <StatsBar />
      <FeatureSection />
      <CapabilityGrid />
      <Testimonials />
      <PresetRules />
      <FinalCTA />
      <Footer />
    </main>
  );
}
