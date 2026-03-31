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
    <div className="min-h-screen w-full bg-stone-900 relative">
      {/* Crimson Shadow Background with Top Glow */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(216, 34, 34, 0.25), transparent 70%), #000000",
        }}
      />

      {/* Your Content/Components */}
      <div className="relative z-10 text-foreground selection:bg-indigo-100 selection:text-indigo-900">
        <Header />

        <main>
          {/* Hero Section */}
          <section className="relative py-24 md:py-32">
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
    </div>
  );
}
