import React from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Address } from "viem";
import abi from "../contracts/mintAbi.json";
import { base } from "wagmi/chains";
import { parseEther } from "viem";
import { useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";

const CONTRACT_ADDRESS =
  "0xD01b4C97266Ef8ec987D21A8Cf332EA0Fa3730cB" as Address;

interface MintButtonProps {
  fid: number | string;
}

const MintButton: React.FC<MintButtonProps> = ({ fid }) => {
  // Write hook
  const { writeContract, data: hash, isPending } = useWriteContract();

  const [isClicked, setIsClicked] = useState(false);

  // Track confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const handleMintNFT = () => {
    setIsClicked(true);
    setTimeout(() => {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: "mintNFT",
        args: [fid],
        value: parseEther("0.0003"),
        chainId: base.id,
      });
    }, 500);

    setTimeout(() => setIsClicked(false), 500);
  };

  useEffect(() => {
    if (isConfirmed) {
      sdk.haptics.notificationOccurred("success");
    }
  }, [isConfirmed]);

  return (
    <div className="w-full flex justify-center">
      <button
        onClick={handleMintNFT}
        disabled={isPending || isConfirming || isConfirmed}
        className="text-white text-center py-2 rounded-xl font-semibold text-lg shadow-lg relative overflow-hidden transform transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center gap-2"
        style={{
          background:
            "linear-gradient(90deg, #8B5CF6, #7C3AED, #A78BFA, #8B5CF6)",
          backgroundSize: "300% 100%",
          animation: "gradientAnimation 3s infinite ease-in-out",
        }}
      >
        <div
          className={`absolute inset-0 bg-[#38BDF8] transition-all duration-500 ${
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
          <span className="relative z-10">
            {" "}
            {isPending
              ? "Processing..."
              : isConfirming
              ? "Minting..."
              : isConfirmed
              ? "Minted!"
              : "Mint your FarProfile"}
          </span>
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
};

export default MintButton;
