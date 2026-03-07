import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function DMCAPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto py-24 px-4 max-w-4xl">
        <h1 className="text-4xl font-extrabold mb-8 tracking-tight">DMCA Compliance</h1>
        <div className="prose prose-indigo dark:prose-invert max-w-none space-y-8">
          <p className="text-xl text-muted-foreground italic border-l-4 border-primary pl-6 py-2">
            V-Downloader respects the intellectual property rights of others and expects users to do the same.
          </p>

          <section>
            <h2 className="text-2xl font-bold mb-4">1. Copyright Infringement</h2>
            <p className="text-muted-foreground leading-relaxed">
              As a technical tool, V-Downloader does not host any user-uploaded content. We facilitate the download of content hosted on third-party platforms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Notice and Takedown</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you believe our tool is being used to infringe on your copyright, please contact us with a formal notice containing:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>Identification of the material that is claimed to be infringing.</li>
              <li>Your contact information (Email, Address).</li>
              <li>A statement of good faith belief that the use is not authorized.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For DMCA notices, please contact us at: <span className="text-primary font-bold">jaiminacharya333@gmail.com</span>
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
