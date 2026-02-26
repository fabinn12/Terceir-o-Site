import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-8 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm opacity-80">
          &copy; {new Date().getFullYear()} TERCEIRÃO – Formatura 2026. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
