import React from 'react';

import whatsappLogo from '../assets/w.png';
import instagramLogo from '../assets/i.png';
import tiktokLogo from '../assets/Tik.png';

const SocialPage = () => {
  const links = [
    {
      name: 'WhatsApp',
      logo: whatsappLogo,
      url: 'https://w.app/w6hgum',
      color: 'bg-[#0066cc]',
      textColor: 'text-[#0066cc]',
      description: 'Fale conosco para dúvidas e informações'
    },
    {
      name: 'Instagram',
      logo: instagramLogo,
      url: 'https://www.instagram.com/cmterceiro?igsh=dmI3cGphZzdkMGI4',
      color: 'bg-[#1e3a5f]',
      textColor: 'text-[#1e3a5f]',
      description: 'Acompanhe nossas novidades'
    },
    {
      name: 'TikTok',
      logo: tiktokLogo,
      url: 'https://www.tiktok.com/@cmterceiro?_r=1&_t=ZS-94AoJS4LGCL',
      color: 'bg-[#001a4d]',
      textColor: 'text-[#001a4d]',
      description: 'Veja nossos conteúdos e momentos'
    }
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#f8fafc]">
      <div className="container mx-auto px-4 max-w-5xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a5f] mb-4">
          Nossas Redes Sociais
        </h1>

        <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Acompanhe nossa jornada até a formatura, fique por dentro das novidades e interaja com a nossa turma!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 flex flex-col items-center"
            >
              {/* Círculo maior */}
              <div className={`w-28 h-28 rounded-full ${link.color} flex items-center justify-center mb-6 shadow-md`}>
                
                {/* Miolo branco */}
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
                  <img
                    src={link.logo}
                    alt={link.name}
                    className="w-14 h-14 object-contain"
                  />
                </div>

              </div>

              <h2 className={`text-2xl font-bold ${link.textColor} mb-2`}>
                {link.name}
              </h2>

              <p className="text-gray-500 font-medium text-center">
                {link.description}
              </p>

              <div className={`mt-6 px-6 py-2 rounded-full text-sm font-bold text-white ${link.color} w-full text-center`}>
                Acessar
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SocialPage;
