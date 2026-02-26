import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Inicial', path: '/' },
    { name: 'Pix', path: '/pix' },
    { name: 'Noite de Massas', path: '/noite-massas' },
    { name: 'Social', path: '/social' },
    { name: 'Painel', path: '/admin' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-wider">
          TERCEIRÃO
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`transition-colors hover:text-secondary ${
                isActive(link.path) ? 'text-secondary font-semibold' : 'text-primary-foreground/80'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-primary-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-primary border-t border-primary-foreground/10">
          <nav className="flex flex-col px-4 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`py-3 transition-colors ${
                  isActive(link.path) ? 'text-secondary font-semibold' : 'text-primary-foreground/80'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
