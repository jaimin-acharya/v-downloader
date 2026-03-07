import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Downloader from "@/components/Downloader";
import PlatformGrid from "@/components/PlatformGrid";
import FeatureCards from "@/components/FeatureCards";
import HowItWorks from "@/components/HowItWorks";
import FAQAccordion from "@/components/FAQAccordion";
import { Toaster } from "sonner";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-indigo-100 selection:text-indigo-900">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 md:py-32">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-30 blur-3xl pointer-events-none">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full animate-pulse [animation-delay:1s]"></div>
          </div>

          <div className="container mx-auto px-4">
            <Downloader />
          </div>
        </section>

        <PlatformGrid />
        
        <FeatureCards />
        
        <HowItWorks />

        <FAQAccordion />
      </main>

      <Footer />
      <Toaster position="bottom-right" />
    </div>
  );
}
