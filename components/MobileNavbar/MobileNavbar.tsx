import React, { useState } from "react";
import Link from "next/link";
import { LinkingModel } from "../model/LinkModel";

interface Props {
  links: LinkingModel[];
}

const MobileNavbar: React.FC<Props> = ({ links }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Helper function to render the appropriate link
  const renderLink = (link: LinkingModel) => {
    const handleClick = () => {
      setIsOpen(false); // Close menu when link is clicked
    };

    // If the link starts with '#', it's an internal hash link
    if (link.idtojump.startsWith('#')) {
      return (
        <a 
          href={link.idtojump} 
          className="px-4 py-2 text-white hover:text-secondary transition-colors"
          onClick={handleClick}
        >
          <h3 className="font-semibold text-lg">{link.name}</h3>
        </a>
      );
    }
    
    // If it's not a hash link, use Next.js Link component
    return (
      <Link 
        href={link.idtojump}
        className="px-4 py-2 text-white hover:text-secondary transition-colors"
        onClick={handleClick}
      >
        <h3 className="font-semibold text-lg">{link.name}</h3>
      </Link>
    );
  };

  return (
    <nav className="w-full bg-primary shadow-md">
      <div className="max-w-wrapper mx-auto flex items-center justify-between py-4 px-6">
        <Link href="/">
          <span className="text-2xl md:text-3xl font-bold text-white">veveve</span>
        </Link>
        <button
          className="text-white text-2xl"
          onClick={toggleMenu}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          <svg 
            stroke="currentColor" 
            fill="currentColor" 
            strokeWidth="0" 
            viewBox="0 0 448 512" 
            height="24px"
            width="24px"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isOpen ? (
              <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z" />
            ) : (
              <path d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z" />
            )}
          </svg>
        </button>
        {isOpen && (
          <div className="fixed inset-0 bg-black/70 z-50 flex flex-col items-center justify-center">
            <button className="absolute top-6 right-6 text-white text-3xl" onClick={toggleMenu}>
              ×
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
      </div>
    </nav>
  );
};

export default MobileNavbar;