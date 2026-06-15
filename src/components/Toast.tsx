import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
  onClose: () => void;
}

export default function Toast({ message, type, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className="fixed top-6 left-1/2 z-50 flex items-center gap-3 bg-slate-950 border border-blue-500/40 text-white px-5 py-3 rounded-xl shadow-2xl shadow-blue-900/30 font-medium text-xs tracking-wide"
        >
          {type === 'success' ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-rose-500/15 flex items-center justify-center text-rose-400 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          )}
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
