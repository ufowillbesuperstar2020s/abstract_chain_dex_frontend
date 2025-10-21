'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

type ToastProps = {
  message: string;
  show: boolean;
  onClose?: () => void;
};

export default function Toast({ message, show, onClose }: ToastProps) {
  React.useEffect(() => {
    if (show && onClose) {
      const timer = setTimeout(onClose, 1000); // auto hide after 1s
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-5 left-1/2 z-[9999] -translate-x-1/2 rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm text-white shadow-lg backdrop-blur-lg"
        >
          <div className="flex items-center gap-3">
            <Image width={15} height={15} src="/images/icons/copy.svg" alt="Copy" />
            <span className="whitespace-nowrap">{message}</span>
            <button onClick={onClose} className="ml-auto text-white/70 hover:text-white focus:outline-none">
              <i className="fa-solid fa-xmark text-xs" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
