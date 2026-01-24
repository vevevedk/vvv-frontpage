import React, { useRef } from 'react';
import Link from 'next/link';

interface HeroProps {
  title?: string;
  subtitle?: string;
  videoUrl?: string;
  ctaPrimary?: { text: string; href: string };
  ctaSecondary?: { text: string; href: string };
}

const Hero: React.FC<HeroProps> = ({ 
  title = "AI-Powered Marketing Analytics That Drive Growth",
  subtitle = "Unify your marketing data across channels. Get real-time insights. Make data-driven decisions that accelerate growth.",
  videoUrl = '/videos/hero.mp4',
  ctaPrimary = { text: "Start Free Trial", href: "/register" },
  ctaSecondary = { text: "See Demo", href: "#services" }
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="relative w-full min-h-screen overflow-hidden flex items-center">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/90 to-primary-dark/90 z-10" />
      <video
        ref={videoRef}
        className="w-full h-full object-cover absolute top-0 left-0"
        loop
        autoPlay
        muted
        playsInline
        src={videoUrl}
        onError={(e) => {
          console.error('Video loading error:', e);
          // Fallback: hide video and show background gradient
          if (videoRef.current) {
            videoRef.current.style.display = 'none';
          }
        }}
      />
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
            {title}
          </h1>
          
          {/* Subheadline */}
          {subtitle && (
            <p className="text-lg sm:text-xl md:text-2xl text-white/95 mb-10 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
              {subtitle}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
            <Link
              href={ctaPrimary.href}
              className="inline-flex items-center justify-center px-8 py-4 bg-secondary hover:bg-secondary/90 text-white font-semibold rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 min-w-[200px]"
            >
              {ctaPrimary.text}
            </Link>
            
            {ctaSecondary && (
              <Link
                href={ctaSecondary.href}
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg border-2 border-white/30 hover:border-white/50 transition-all duration-200 backdrop-blur-sm min-w-[200px]"
              >
                {ctaSecondary.text}
              </Link>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-sm text-white/80 mb-4">Trusted by leading companies</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-80">
              <div className="text-white/60 text-sm">50+ Active Clients</div>
              <div className="text-white/60 text-sm">$500M+ Revenue Tracked</div>
              <div className="text-white/60 text-sm">99.9% Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Hero);