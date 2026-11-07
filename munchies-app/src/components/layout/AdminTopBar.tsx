/**
 * @module components/layout/AdminTopBar
 * @description Top header bar for the admin dashboard strictly in Arabic.
 */

import React from 'react';
import { Bell, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes';

export const AdminTopBar: React.FC = () => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-extrabold text-[#26212B]">
          لوحة تحكم وإدارة طلبات مانشيز
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <Link
          to={ROUTES.HOME}
          target="_blank"
          className="flex items-center gap-1.5 text-xs font-bold text-[#512080] hover:underline"
        >
          <span>عرض موقع الزبائن</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        <button className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-[#E84D45]" />
        </button>
      </div>
    </header>
  );
};
