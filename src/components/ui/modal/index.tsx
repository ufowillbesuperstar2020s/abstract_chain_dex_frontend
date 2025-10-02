"use client";
import React, { useRef, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  isFullscreen?: boolean;

  // NEW:
  align?: "center" | "top";           // default: "center"
  radius?: "none" | "lg" | "3xl";      // default: "3xl"
  showBackdrop?: boolean;              // default: true
  closeVariant?: "ghost" | "solid";    // default: "ghost"
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  showCloseButton = true,
  isFullscreen = false,
  align = "center",
  radius = "3xl",
  showBackdrop = true,
  closeVariant = "ghost",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  const wrapperClass =
    align === "top"
      ? "fixed inset-0 z-99999 flex justify-center items-start pt-10"
      : "fixed inset-0 z-99999 flex justify-center items-center";

  const radiusClass =
    radius === "none" ? "rounded-none" : radius === "lg" ? "rounded-lg" : "rounded-3xl";

  const contentClasses = isFullscreen
    ? "w-full h-full"
    : `relative bg-white dark:bg-gray-900 ${radiusClass}`;

  return (
    <div className={wrapperClass}>
      {showBackdrop && (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        ref={modalRef}
        className={`${contentClasses} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            aria-label="Close"
            onClick={onClose}
            className={`absolute right-4 top-4 text-white/70 hover:text-white focus:outline-none
              ${closeVariant === "solid" ? "bg-white/10 hover:bg-white/15 rounded-full p-2" : ""}`}
          >
          </button>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};
