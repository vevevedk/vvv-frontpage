import React, { useState } from "react";
import Link from "next/link";
import { LinkingModel } from "../model/LinkModel";
import { FaBars, FaTimes } from 'react-icons/fa';

interface Props {
  links: LinkingModel[];
}

const Nav: React.FC<Props> = ({ links }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  // Helper function to render the appropriate link
  const renderLink = (link: LinkingModel) => {
    const baseClasses = "px-3 py-2 md:px-4 text-white hover:text-secondary transition-colors rounded-lg hover:bg-primary-dark/50 font-semibold text-base md:text-lg";
    
    if (link.idtojump.startsWith('#')) {
      return (
        <a 
          href={link.idtojump} 
          className={baseClasses}
          onClick={handleLinkClick}
        >
          {link.name}
        </a>
      );
    }
    return (
      <Link 
        href={link.idtojump}
        className={baseClasses}
        onClick={handleLinkClick}
      >
        {link.name}
      </Link>
    );
  };

  return (
    <>
      <div className="w-full bg-primary shadow-md sticky top-0 z-40">
        <nav className="max-w-wrapper mx-auto flex items-center justify-between py-3 md:py-4 px-4 sm:px-6">
          <a href="/" className="flex items-center">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white">veveve</span>
          </a>
          <ul className="hidden md:flex space-x-6 lg:space-x-8">
            {links.map((link) => (
              <li key={link.name + link.id}>
                {renderLink(link)}
              </li>
            ))}
          </ul>
          <button 
            className="md:hidden text-white text-2xl p-2 hover:bg-primary-dark rounded-lg transition-colors" 
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </nav>
      </div>
      {/* Mobile nav */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center md:hidden"
          onClick={toggleMenu}
        >
          <button 
            className="absolute top-6 right-6 text-white text-3xl p-2 hover:bg-white/10 rounded-lg transition-colors" 
            onClick={toggleMenu}
            aria-label="Close menu"
          >
            <FaTimes />
          </button>
          <ul className="flex flex-col space-y-6 px-8">
            {links.map((link) => (
              <li key={link.name + link.id} className="text-center">
                {renderLink(link)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default Nav;