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
    if (link.idtojump.startsWith('#')) {
      return (
        <a 
          href={link.idtojump} 
          className="px-4 py-2 text-white hover:text-secondary transition-colors"
          onClick={handleLinkClick}
        >
          <h3 className="font-semibold text-lg">{link.name}</h3>
        </a>
      );
    }
    return (
      <Link 
        href={link.idtojump}
        className="px-4 py-2 text-white hover:text-secondary transition-colors"
        onClick={handleLinkClick}
      >
        <h3 className="font-semibold text-lg">{link.name}</h3>
      </Link>
    );
  };

  return (
    <>
      <div className="w-full bg-primary shadow-md">
        <nav className="max-w-wrapper mx-auto flex items-center justify-between py-4 px-6">
          <a href="/" className="flex items-center">
            <span className="text-2xl md:text-3xl font-bold text-white">veveve</span>
          </a>
          <ul className="hidden md:flex space-x-8">
            {links.map((link) => (
              <li key={link.name + link.id}>
                {renderLink(link)}
              </li>
            ))}
          </ul>
          <button className="md:hidden text-white text-2xl" onClick={toggleMenu}>
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </nav>
      </div>
      {/* Mobile nav */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex flex-col items-center justify-center md:hidden">
          <button className="absolute top-6 right-6 text-white text-3xl" onClick={toggleMenu}>
            <FaTimes />
          </button>
          <ul className="flex flex-col space-y-8">
            {links.map((link) => (
              <li key={link.name + link.id}>
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