import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto py-24 px-4 max-w-4xl">
        <h1 className="text-4xl font-extrabold mb-8 tracking-tight">Privacy Policy</h1>
        <div className="prose prose-indigo dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              At V-Downloader, your privacy is our priority. This policy explains how we handle your data when you use our video downloader services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Zero Data Collection</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not store your download history, the URLs you paste, or any personal information about your usage. Our processing happens in real-time, and files are streamed directly to your device.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may use localized browser storage (like localStorage) to remember your preferences, such as your preferred video quality. We do not use tracking cookies for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Third-Party Links</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our service interacts with third-party video platforms. Once you leave our site or download content, you are subject to the privacy policies of those respective platforms.
            </p>
          </section>

          <section>
            <p className="text-sm text-muted-foreground mt-12">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
