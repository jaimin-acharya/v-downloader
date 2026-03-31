"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download, Github, Menu, X } from "lucide-react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  // Close menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/20">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group transition-transform hover:scale-105">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
            <Download className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-black tracking-tighter">V-Downloader</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={`/${link.href}`}
              className="text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link 
            href="https://github.com/jaimin-acharya/v-downloader" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors pr-2"
          >
            <Github className="w-4 h-4" />
            <span className="hidden lg:inline">Star on GitHub</span>
          </Link>
          
          <Link href="/#downloader" className="hidden sm:block">
            <Button size="sm" className="bg-primary hover:opacity-90 font-bold px-5 rounded-xl">
              Get Started
            </Button>
          </Link>

          {/* Hamburger Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 md:hidden text-foreground hover:bg-muted rounded-xl transition-colors"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-x-0 bottom-0 top-[65px] z-40 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/70 md:hidden transition-all duration-300 ease-in-out ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <nav className={`bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/70 flex flex-col items-center justify-center min-h-[70vh] gap-10 p-10 transition-all duration-500 ${isOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={`/${link.href}`}
              onClick={() => setIsOpen(false)}
              className="relative text-3xl font-black tracking-tighter text-foreground hover:text-primary transition-colors group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-1 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
          
          <div className="w-full h-px bg-border max-w-[150px] my-2" />
          
          <div className="flex flex-col w-full max-w-[300px] gap-5">
            <Link
              href="https://github.com/jaimin-acharya/v-downloader"
              target="_blank"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-muted/50 text-lg font-bold text-muted-foreground hover:bg-muted transition-all active:scale-95 border border-border/50"
            >
              <Github className="w-6 h-6" />
              Star on GitHub
            </Link>
            <Link href="/#downloader" onClick={() => setIsOpen(false)}>
              <Button className="w-full bg-primary hover:opacity-90 font-black py-7 rounded-2xl text-xl shadow-2xl shadow-primary/20 transition-all active:scale-95">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>
        
        {/* Background Decorative Element */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary/5 to-transparent -z-10 pointer-events-none" />
      </div>
    </header>
  );
}
