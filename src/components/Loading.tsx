import { useState, useEffect } from "react";

export default function FancyLoadingScreen() {
  const [text, setText] = useState("");
  const [dots, setDots] = useState("");
  const fullText = "Loading";

  useEffect(() => {
    let i = 0;
    const type = setInterval(() => {
      setText(fullText.slice(0, i + 1));
      i++;
      if (i === fullText.length) {
        clearInterval(type);
        startDots();
      }
    }, 150);

    const startDots = () => {
      let d = 0;
      const dotInt = setInterval(() => {
        d = (d + 1) % 4;
        setDots(".".repeat(d));
      }, 500);
      return () => clearInterval(dotInt);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white overflow-hidden">
      {/* Orb loader */}
      <div className="relative w-24 h-24 mb-8 animate-float">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-500 animate-spin-slow border-t-transparent" />
        <div className="absolute inset-2 rounded-full border-4 border-purple-400 animate-spin-slower border-b-transparent" />
      </div>

      {/* Plain white text with fixed width to avoid layout shift */}
      <div className="text-3xl sm:text-4xl font-bold tracking-widest text-center w-[10ch]">
        {text}
        {dots}
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes spin-slower {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
          100% {
            transform: translateY(0px);
          }
        }
        .animate-spin-slow {
          animation: spin 2s linear infinite;
        }
        .animate-spin-slower {
          animation: spin 4s linear infinite reverse;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
