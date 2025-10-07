'use client';

import Modal from '@/components/ui/modal';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

// ---- modal component ----
export default function TradeExeSettingModal({ isOpen, onClose }: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[998] bg-black/40 backdrop-blur-md"
      className="fixed inset-0 z-[999] flex items-start justify-center px-4"
      align="top"
      closeOnOverlayClick
    >
      <div className="absolute top-1/2 left-1/2 h-[540px] w-[620px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-4xl bg-gradient-to-br from-[rgba(0,111,80,1)] via-[rgba(34,36,38,1)] via-38% to-[rgba(34,36,38,1)] to-100% text-white shadow-lg backdrop-blur-xl">
        <div className="mt-5 mr-30 flex flex-col">
          <div className="mx-20 my-10 mb-2 w-[90%]">
            <div>
              <span>Slippage (%)</span>
            </div>
            <div className="mt-5 flex h-14 items-center gap-3 rounded-xl border-1 border-white/25 px-4">
              <input
                placeholder="20"
                className="flex-1 bg-transparent text-base outline-none placeholder:text-white/50"
              />
            </div>
          </div>

          <div className="mx-20 my-10 mb-2 w-[90%]">
            <div>
              <span>Slippage (%)</span>
            </div>
            <div className="mt-5 flex h-14 items-center gap-3 rounded-xl border-2 border-white/25 px-4">
              <input
                placeholder="20"
                className="flex-1 bg-transparent text-base outline-none placeholder:text-white/50"
              />
            </div>
          </div>

          <div className="mx-20 my-10 mb-2 w-[90%]">
            <div>
              <span>Slippage (%)</span>
            </div>
            <div className="mt-5 flex h-14 items-center gap-3 rounded-xl border-2 border-white/25 px-4">
              <input
                placeholder="20"
                className="flex-1 bg-transparent text-base outline-none placeholder:text-white/50"
              />
            </div>
          </div>
        </div>

        <div className="absolute top-8 right-8">
          <button type="button" onClick={onClose} aria-label="Close" className="ml-2 rounded p-1 hover:bg-white/10">
            <i className="fa-solid fa-xmark text-xl" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
