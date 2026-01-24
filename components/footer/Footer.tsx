import React from "react";
import Image from "next/image";
import VeVeVeLogo from "../../public/images/logo.svg";
import FooterInfo from "./components/FooterInfo";
import FooterSocial from "./components/FooterSocial";
import { FaShieldAlt, FaLock, FaCheckCircle } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer id="contact" className="w-full bg-dark-grey py-12 md:py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="flex flex-col items-center gap-12 mb-12">
          <div className="w-48 h-12 md:w-60 md:h-14 relative">
            <Image 
              src={VeVeVeLogo} 
              alt="VeVeVe Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
          
          <div className="flex flex-col items-center gap-8 w-full md:flex-row md:justify-around md:items-start">
            <FooterInfo />
            <FooterSocial />
          </div>
        </div>

        {/* Trust & Security Section */}
        <div className="border-t border-gray-700 pt-8 pb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
              <div className="flex items-center gap-2 text-white/80">
                <FaShieldAlt className="text-secondary" />
                <span className="text-sm">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <FaLock className="text-secondary" />
                <span className="text-sm">Enterprise Security</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <FaCheckCircle className="text-secondary" />
                <span className="text-sm">SOC 2 Type II</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
              <div>99.9% Uptime</div>
              <div className="hidden sm:block">•</div>
              <div>50+ Clients</div>
              <div className="hidden sm:block">•</div>
              <div>$500M+ Tracked</div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 pt-6">
          <p className="text-center text-sm text-white/60">
            © {new Date().getFullYear()} Veveve. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
