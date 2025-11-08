import React, { useState, useEffect, useRef } from "react";

interface ToastProps {
  message: string;
  duration?: number;
  onClose: () => void;
}
const Toast: React.FC<ToastProps> = ({ message, duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, duration);

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const percent = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(percent);
      }, 30);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-16 inset-x-0 mx-auto w-fit z-50 flex flex-col items-center animate-slide-down">
      <div className="relative bg-gradient-to-br from-red-500 to-red-600 text-white px-4 py-3 rounded-xl shadow-lg border border-red-400/40 w-full overflow-hidden">
        <div className="flex items-center font-semibold text-sm sm:text-base">
          {message}
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 animate-shimmer" />

        {/* progress bar */}
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/20">
          <div
            className="h-full bg-white rounded-r transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Toast;
