import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const padMap = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };

export function Card({ children, className, padding = 'md', hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200 rounded-2xl shadow-sm',
        padMap[padding],
        hover && 'hover:shadow-md hover:border-slate-300 transition-all duration-200',
        className
      )}
    >
      {children}
    </div>
  );
}

export function DarkCard({ children, className, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[#0f172a] border border-slate-800 rounded-2xl',
        padMap[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
