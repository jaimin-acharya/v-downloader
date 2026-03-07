import { Youtube, Instagram, Facebook, Twitter, Globe } from "lucide-react";

const platforms = [
  { name: "YouTube", icon: Youtube, color: "text-red-600" },
  { name: "Instagram", icon: Instagram, color: "text-pink-600" },
  { name: "Facebook", icon: Facebook, color: "text-blue-600" },
  { name: "X (Twitter)", icon: Twitter, color: "text-white" },
];

export default function PlatformGrid() {
  return (
    <section id="platforms" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Supported Platforms</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our tool works seamlessly across all major video sharing and social media platforms.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {platforms.map((platform) => (
            <div key={platform.name} className="flex flex-col items-center p-6 bg-background rounded-2xl shadow-sm border transition-all hover:shadow-md hover:scale-105">
              <platform.icon className={`w-10 h-10 mb-3 ${platform.color}`} />
              <span className="font-medium">{platform.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
