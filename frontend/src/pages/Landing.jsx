import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { About } from "@/components/landing/About";
import { Services } from "@/components/landing/Services";
import { Gallery } from "@/components/landing/Gallery";
import { Results } from "@/components/landing/Results";
import { BookingTeaser } from "@/components/landing/BookingTeaser";
import { Footer } from "@/components/landing/Footer";

export default function Landing() {
  return (
    <div className="bg-cream" data-testid="landing-page">
      <Navbar />
      <Hero />
      <About />
      <Services />
      <Gallery />
      <Results />
      <BookingTeaser />
      <Footer />
    </div>
  );
}
