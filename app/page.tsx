import Navbar from '@/components/layout/Navbar';
import HeroSection from '@/components/hero/HeroSection';
import BentoGrid from '@/components/bento/BentoGrid';
import Footer from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <BentoGrid />
      <Footer />
    </main>
  );
}
