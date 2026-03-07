"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Globe, Youtube, Instagram, Facebook, Twitter, Music } from "lucide-react";
import Image from "next/image";

interface Props {
  title: string;
  thumbnail: string;
  duration: string;
  platform: string;
}

const platformIcons: Record<string, any> = {
  youtube: Youtube,
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  tiktok: Music,
};

export default function VideoPreview({ title, thumbnail, duration, platform }: Props) {
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const platformKey = platform.toLowerCase().replace(/tab$/, "");
  const PlatformIcon = platformIcons[platformKey] || Globe;

  return (
    <Card className="overflow-hidden rounded-3xl border border-border/50 shadow-2xl bg-card transition-all hover:border-primary/20">
      <div className={`relative aspect-video bg-muted ${loading ? 'animate-pulse' : ''} overflow-hidden`}>
        {!imgError ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className={`object-cover transition-all duration-700 ${loading ? 'scale-110 blur-xl opacity-0' : 'scale-100 blur-0 opacity-100'}`}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setImgError(true);
            }}
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-muted/50 text-muted-foreground flex-col gap-2">
            <Globe className="w-12 h-12 opacity-20" />
            <span className="text-xs font-medium opacity-50 uppercase tracking-widest">Preview unavailable</span>
          </div>
        )}
        {/* Overlay for better text legibility */}
        {!imgError && <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />}
        
        <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs text-white font-mono font-bold shadow-lg">
          {duration}
        </div>
      </div>
      
      <CardContent className="p-6 space-y-4">
        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 pl-2 pr-3 py-1 font-bold">
          <PlatformIcon className="w-3.5 h-3.5 mr-1.5" />
          {platform}
        </Badge>
        
        <h3 className="text-xl font-bold leading-snug line-clamp-2 tracking-tight">
          {title}
        </h3>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium pt-2">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-primary/60" />
            <span>{duration}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center italic">
            <span>Ready for download</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
