import React from 'react';
import { ListingCategory } from '../../types';

interface CategoryBadgeProps {
  category: ListingCategory;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className = '' }) => {
  const formatName = (cat: string) => {
    return cat.replace('_', ' ');
  };

  return (
    <span
      className={`inline-block font-mono text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-800 ${className}`}
    >
      {formatName(category)}
    </span>
  );
};
