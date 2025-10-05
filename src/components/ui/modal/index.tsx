// src/components/ui/modal/index.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;

  /** Applied to the FLEX WRAPPER that centers the panel (not to the panel itself). */
  className?: string;

  /** Applied to the overlay element. */
  overlayClassName?: string;

  /** CSS selector or element to portal into. */
  portalTo?: string | HTMLElement;

  /** Close when clicking the overlay. Default: true */
  closeOnOverlayClick?: boolean;

  /** Vertically center or stick to top. Default: 'top' */
  align?: 'top' | 'center';
};

export function Modal({
  isOpen,
  onClose,
  children,
  className,
  overlayClassName,
  portalTo = 'body',
  closeOnOverlayClick = true,
  align = 'top'
}: ModalProps) {
  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const target = typeof portalTo === 'string' ? (document.querySelector(portalTo) ?? document.body) : portalTo;

  const overlayCls = overlayClassName ?? 'fixed inset-0 z-[998] bg-black/60';
  const wrapperCls = [
    'fixed inset-0 z-[999] flex px-4',
    align === 'center' ? 'items-center justify-center' : 'items-start justify-center',
    // no default width/rounded/padding here — your child controls that!
    className ?? ''
  ].join(' ');

  const node = (
    <div className={overlayCls} onClick={closeOnOverlayClick ? onClose : undefined} aria-hidden>
      <div className={wrapperCls} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );

  return createPortal(node, target);
}

export default Modal;
