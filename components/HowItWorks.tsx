import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Paste Video URL",
    description: "Copy the link of the video you want from YouTube, Instagram, or any other supported platform.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    number: "02",
    title: "Choose Quality",
    description: "Select your preferred video resolution or convert the video directly to high-quality MP3 audio.",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    number: "03",
    title: "Start Download",
    description: "Click the download button and watch the progress in real-time. Your file will be ready in seconds.",
    gradient: "from-purple-500 to-pink-500",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden bg-muted/20">
      {/* Decorative background blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary rounded-full blur-[120px]"></div>
      </div>

      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-extrabold tracking-tight mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Download your favorite content in three simple, lightning-fast steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connecting arrow line for desktop */}
          <div className="hidden md:block absolute top-[22%] left-0 w-full px-24 -z-10">
            <div className="flex justify-between items-center opacity-20">
              <ArrowRight className="w-12 h-12 text-primary" />
              <ArrowRight className="w-12 h-12 text-primary" />
            </div>
          </div>

          {steps.map((step, index) => (
            <div key={index} className="relative flex flex-col items-center text-center">
              <div className="relative mb-8">
                {/* Permanent Glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${step.gradient} rounded-3xl blur-2xl opacity-40`}></div>

                {/* Main Square Container */}
                <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-background flex flex-col items-center justify-center shadow-2xl scale-110 overflow-hidden`}>
                  {/* Large Number */}
                  <div className={`text-3xl sm:text-4xl font-black bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent tracking-tighter`}>
                    {step.number}
                  </div>

                  {/* Subtle Label or Icon */}
                  <div className={`mt-1 h-1 w-8 rounded-full bg-gradient-to-r ${step.gradient} opacity-50`}></div>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-200">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed px-4">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
