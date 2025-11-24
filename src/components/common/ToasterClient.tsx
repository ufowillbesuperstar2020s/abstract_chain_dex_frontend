'use client';

import { Toaster } from 'react-hot-toast';

export default function ToasterClient() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        className: '!bg-gray-800 !text-white',
        duration: 2000
      }}
    />
  );
}
