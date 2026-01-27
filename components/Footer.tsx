import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-gray-900 border-t border-gray-800 py-6 mt-auto no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} TV Marketing AI. All rights reserved.</p>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <a href="/admin/stats" className="hover:text-gray-300 transition-colors">Admin Stats</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;