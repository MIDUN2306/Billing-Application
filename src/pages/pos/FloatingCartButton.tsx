import { ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FloatingCartButtonProps {
  itemCount: number;
  totalAmount: number;
  onClick: () => void;
  hasItems: boolean;
}

export function FloatingCartButton({ itemCount, totalAmount, onClick, hasItems }: FloatingCartButtonProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (hasItems) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(timer);
    }
  }, [itemCount]);

  if (!hasItems) return null;

  return (
    <button
      onClick={onClick}
      className={`lg:hidden fixed bottom-6 right-6 z-40 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl shadow-2xl transition-all duration-300 hover:shadow-primary-500/50 hover:scale-105 active:scale-95 ${
        pulse ? 'animate-pulse' : ''
      } ${isScrolled ? 'py-3 px-4' : 'py-4 px-5'}`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <ShoppingCart className={`${isScrolled ? 'w-5 h-5' : 'w-6 h-6'}`} />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-white">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </div>
        
        {!isScrolled && (
          <div className="flex flex-col items-start">
            <span className="text-xs font-medium opacity-90">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
            <span className="text-lg font-bold">₹{totalAmount.toFixed(2)}</span>
          </div>
        )}
      </div>
    </button>
  );
}
