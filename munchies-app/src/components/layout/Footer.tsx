/**
 * @module components/layout/Footer
 * @description Compact shared footer with simplified brand identity, horizontal quick links, and direct contact.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { ROUTES } from '@/config/routes';

const QUICK_LINKS: Array<{ label: string; to?: string; href?: string }> = [
  { to: ROUTES.HOME, label: 'الرئيسية' },
  { to: ROUTES.MENU, label: 'المنيو' },
  { to: ROUTES.OFFERS, label: 'العروض' },
  { href: 'tel:01025707026', label: 'تواصل معنا' },
];

export const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-white pt-7 pb-5 sm:pt-9 sm:pb-6 border-t-[3px] border-yellow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-8 pb-5 sm:pb-6">
          {/* Brand Identity */}
          <div className="md:col-span-5 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center overflow-hidden border border-yellow/70 shrink-0">
                <img src="/fb_logo.jpg" alt="شعار مانشيز" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-black text-yellow tracking-wide leading-tight">
                  Munchie's | مانشيز
                </p>
                <p className="text-xs text-purple-200 font-semibold leading-snug mt-0.5">
                  لو كبير عليك، اضغطه!
                </p>
              </div>
            </div>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
              أشهى ساندوتشات البرجر والفرايز في أسوان.
            </p>
          </div>

          {/* Quick Links (compact horizontal strip on mobile, clean grid/list on desktop) */}
          <nav
            aria-label="روابط سريعة"
            className="md:col-span-4 md:flex md:flex-col md:justify-center"
          >
            <h4 className="hidden md:block text-xs font-bold text-gray-400 mb-2.5">
              روابط سريعة
            </h4>
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-2 text-sm text-gray-200 font-medium">
              {QUICK_LINKS.map((link) => (
                <li key={link.label}>
                  {link.to ? (
                    <Link
                      to={link.to}
                      className="inline-block py-0.5 hover:text-yellow transition-colors whitespace-nowrap"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="inline-block py-0.5 hover:text-yellow transition-colors whitespace-nowrap"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div className="md:col-span-3 flex items-center justify-between md:flex-col md:items-end md:justify-center gap-3">
            <a
              href="tel:01025707026"
              className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-yellow transition-colors py-1"
            >
              <Phone className="w-4 h-4 text-yellow shrink-0" aria-hidden="true" />
              <span className="number-ltr">01025707026</span>
            </a>

            <a
              href="https://www.facebook.com/p/Munchies-%D9%85%D8%A7%D9%86%D8%B4%D9%8A%D8%B2-61579057995805/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="صفحة مانشيز على فيسبوك"
              title="فيسبوك"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/15 text-gray-200 hover:text-yellow transition-colors shrink-0"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-current"
                aria-hidden="true"
              >
                <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V4.9c-.3 0-1.3-.1-2.5-.1-2.4 0-4.1 1.5-4.1 4.2V11H7.5v3h2.7v8h3.3z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-center text-center">
          <p className="text-xs text-gray-400">
            © 2026 Munchie's. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};
