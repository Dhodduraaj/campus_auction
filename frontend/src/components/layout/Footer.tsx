import React from 'react';
import { Shield, Sparkles, Scale, HeartHandshake } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-orange-600 flex items-center justify-center font-display font-black text-white text-sm">
                C
              </div>
              <span className="font-display font-bold text-white tracking-tight uppercase">
                Campus Auction Platform
              </span>
            </div>
            <p className="text-slate-300 text-sm max-w-md font-sans">
              “Build the place where campus competes fairly for them, and every item finds its next owner.”
            </p>
            <p className="text-xs text-slate-500 font-mono">
              Designed for graduating seniors to pass down campus essentials and for juniors to bid transparently without hidden negotiations.
            </p>
          </div>

          {/* Core Guarantees */}
          <div className="space-y-2">
            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              Campus Guarantees
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-slate-300">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Verified Student Accounts
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Scale className="w-3.5 h-3.5 text-orange-400" />
                Anti-Sniping Real-time Bidding
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <HeartHandshake className="w-3.5 h-3.5 text-teal-400" />
                In-Person Verified Handover
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Zero Waste Campus Reuse
              </li>
            </ul>
          </div>

          {/* Popular Categories */}
          <div className="space-y-2">
            <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              Categories
            </h4>
            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
              <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded">Cycles</span>
              <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded">Calculators</span>
              <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded">Engineering Books</span>
              <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded">Electronics</span>
              <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded">Lab Kits</span>
              <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded">Hostel Furniture</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Campus Auction Platform. Production Full-Stack Edition.</p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0 font-mono text-[11px]">
            <span>PostgreSQL 17</span>
            <span>•</span>
            <span>Spring Boot 3.3.4 (Java 21)</span>
            <span>•</span>
            <span>React & Vite</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
