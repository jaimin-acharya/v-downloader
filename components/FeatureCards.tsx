import { Zap, Shield, Smartphone, Infinity, Download, Music } from "lucide-react";

const features = [
  {
    title: "Fast Downloads",
    description: "Our high-speed servers ensure your videos are ready in seconds.",
    icon: Zap,
    color: "bg-amber-100 text-amber-600",
  },
  {
    title: "HD & 4K Support",
    description: "Download in the highest quality available, up to 4K resolution.",
    icon: Download,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Audio Extraction",
    description: "Convert any video to a high-quality MP3 audio file with one click.",
    icon: Music,
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "Unlimited Use",
    description: "Zero restrictions. Download as many videos as you want for free.",
    icon: Infinity,
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Secure & Private",
    description: "We don't store your data or keep track of what you download.",
    icon: Shield,
    color: "bg-red-100 text-red-600",
  },
  {
    title: "Mobile Friendly",
    description: "Optimized for all devices. Works perfectly on iOS and Android.",
    icon: Smartphone,
    color: "bg-indigo-100 text-indigo-600",
  },
];

export default function FeatureCards() {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Why Choose Us?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the most powerful and user-friendly video downloader on the web.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="p-8 rounded-3xl border bg-background hover:border-primary/50 transition-colors">
              <div className={`w-12 h-12 rounded-2xl ${feature.color} flex items-center justify-center mb-6`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
