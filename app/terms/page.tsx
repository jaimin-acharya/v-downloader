import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto py-24 px-4 max-w-4xl">
        <h1 className="text-4xl font-extrabold mb-8 tracking-tight">Terms of Service</h1>
        <div className="prose prose-indigo dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By using V-Downloader, you agree to these legal terms. If you do not agree, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Permitted Use</h2>
            <p className="text-muted-foreground leading-relaxed">
              V-Downloader is designed for personal, non-commercial use only. You are responsible for ensuring you have the legal right to download any content you access through our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Prohibited Actions</h2>
            <p className="text-muted-foreground leading-relaxed">
              You may not use our service for mass scraping, illegal content distribution, or any action that violates the copyright of content creators or the terms of service of the original platforms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Disclaimer of Warranty</h2>
            <p className="text-muted-foreground leading-relaxed">
              V-Downloader is provided "as is" without any guarantees. We are not responsible for any data loss, device damage, or legal issues resulting from the use of downloaded content.
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
