import { Download, Github, Twitter, Linkedin, Instagram, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const socialLinks = [
    {
      name: "X (Twitter)",
      icon: Twitter,
      href: "https://x.com/JaiminAcha3064",
      color: "hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]",
    },
    {
      name: "GitHub",
      icon: Github,
      href: "https://github.com/jaimin-acharya",
      color: "hover:bg-foreground/10 hover:text-foreground",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: "https://www.linkedin.com/in/jaimin-acharya-40774b295/",
      color: "hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]",
    },
    {
      name: "Instagram",
      icon: Instagram,
      href: "https://www.instagram.com/jaiminacharya9/",
      color: "hover:bg-[#E4405F]/10 hover:text-[#E4405F]",
    },
  ];

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto py-16 px-4">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-8">
            <div className="flex items-center gap-3">

              <div className="bg-primary p-2.5 rounded-2xl shadow-lg shadow-primary/20">
                <Download className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-black tracking-tight tracking-tighter">V-Downloader</span>

            </div>

            <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
              The premium destination for high-speed, secure video downloads from any social platform.
              Zero tracking. Maximum quality.
            </p>

            <div className="flex flex-wrap gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.name}
                  className={`group flex items-center justify-center w-12 h-12 rounded-2xl bg-muted/50 transition-all duration-300 ${social.color} hover:scale-110 active:scale-95 border border-transparent hover:border-current/20`}
                >
                  <social.icon className="w-5 h-5 transition-transform group-hover:rotate-6" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-7 grid sm:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/50">SERVICES</h3>
              <ul className="space-y-4">
                {["MP3 Converter", "Video Downloader", "URL Downloader"].map((item) => (
                  <li key={item}>
                    <Link href="#downloader" className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                      {item}
                      <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>



            <div className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/50">Legal</h3>
              <ul className="space-y-4">
                {[
                  { name: "Privacy Policy", href: "/privacy" },
                  { name: "Terms of Service", href: "/terms" },
                  { name: "DMCA", href: "/dmca" }
                ].map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="flex items-center text-muted-foreground hover:text-primary transition-colors group">
                      {item.name}
                      <ArrowUpRight className="w-3 h-3 ml-1 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-10 border-t flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} V-Downloader. Engineered by Jaimin Acharya.</p>
        </div>
      </div>
    </footer>
  );
}
