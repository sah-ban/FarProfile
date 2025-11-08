import { useConnect } from "wagmi";
import {  useState } from "react";
import { config } from "./providers/WagmiProvider";

export default function Connect() {
  const { connect } = useConnect();
  const [isClicked, setIsClicked] = useState(false);

  const handleConnect = () => {
    setIsClicked(true);
    setTimeout(() => {
      connect({ connector: config.connectors[0] });
    }, 500);

    setTimeout(() => setIsClicked(false), 500);
  };

  return (
    <div className="flex flex-col mt-2">
      <button
        onClick={handleConnect}
        className="text-black bg-white text-center py-2 rounded-xl font-semibold text-lg shadow-lg relative overflow-hidden transform transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center gap-2 mb-4 cursor-pointer"
      >
        <div
          className={`absolute inset-0 bg-gray-600 transition-all duration-500 ${
            isClicked ? "scale-x-100" : "scale-x-0"
          }`}
          style={{ transformOrigin: "center" }}
        ></div>
        <style>{`
              @keyframes gradientAnimation {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
            `}</style>
        <div className="flex flex-row gap-2 px-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 relative z-10"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
            />
          </svg>{" "}
          <span className="relative z-10"> {`Connect Wallet`}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 relative z-10"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
            />
          </svg>{" "}
        </div>
      </button>
    </div>
  );
}
