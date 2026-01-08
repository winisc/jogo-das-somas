import { useState, useEffect, useCallback } from "react";
import "../index.css";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  extraButtons,
  onReset,
  onPlayAgain,
  gameStarted,
}) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 290);
  }, [onClose]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isClosing ? "modal-closing" : "modal-opening"
      }`}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 modal-overlay"
        onClick={handleClose}
      />

      {/* Modal box */}
      <div className="relative w-[90%] max-w-sm rounded-2xl bg-[#d4e2b6] p-6 shadow-xl modal-box">
        <h2 className="text-lg font-semibold text-[#539fa2] mb-4 text-center">
          {title}
        </h2>

        {children}

        <div className="flex flex-col gap-2 mt-6">
          {extraButtons && gameStarted && (
            <>
              <button
                onClick={() => {
                  handleClose();
                  onReset && onReset();
                }}
                className="w-full py-2 rounded-xl bg-[#c4dbb4] text-[#539fa2] font-medium active:scale-95 transition cursor-pointer"
              >
                Voltar para o início
              </button>
              <button
                onClick={() => {
                  handleClose();
                  onPlayAgain && onPlayAgain();
                }}
                className="w-full py-2 rounded-xl bg-[#c4dbb4] text-[#539fa2] font-medium active:scale-95 transition cursor-pointer"
              >
                Reiniciar partida
              </button>
            </>
          )}
          <button
            onClick={handleClose}
            className="w-full py-2 rounded-xl bg-[#c4dbb4] text-[#539fa2] font-medium active:scale-95 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
