import { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import sdk from "@farcaster/miniapp-sdk";

const AMOUNTS = [1, 5, 10, 25];

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const RECIPIENT = "0x21808EE320eDF64c019A6bb0F7E4bFB3d62F06Ec";

const USDC_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
];

export default function SupportDeveloperCard() {
  const [open, setOpen] = useState(false);

  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const [amount, setAmount] = useState<string>("5");

  // Read USDC balance
  const { data: balance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const formattedBalance = balance
    ? Number(formatUnits(balance as bigint, 6))
    : 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // allow empty
    if (value === "") {
      setAmount("");
      return;
    }

    // max 6 decimals
    if (!/^\d*\.?\d{0,6}$/.test(value)) return;

    setAmount(value);
  };

  const numericAmount = Number(amount);
  const hasEnoughBalance =
    numericAmount > 0 && numericAmount <= formattedBalance;

  const sendUSDC = () => {
    if (!numericAmount) return;

    writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: "transfer",
      args: [RECIPIENT, parseUnits(amount, 6)],
    });
  };

  useEffect(() => {
    if (isConfirmed) {
      sdk.haptics.notificationOccurred("success");
    }
  }, [isConfirmed]);

  return (
    <>
      {/* TIP BUTTON */}
      <button
        onClick={() => setOpen(true)}
            className="bg-white/20 hover:bg-white/30 transition p-2 rounded-xl flex items-center justify-center cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="white"
          className="size-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
          />
        </svg>

      </button>

      {/* POPUP */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Card */}
          <div className="relative z-10 w-full max-w-sm mx-4">
            {/* ❌ CLOSE BUTTON */}
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-3 -right-3 bg-white text-slate-900 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:scale-110 transition"
            >
              ✕
            </button>

            {/* ⬇️ MOVE YOUR EXISTING CARD DIV HERE ⬇️ */}
            <div className="rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 p-6 text-white shadow-xl">
              {/* Heart */}
              <div className="flex justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-16"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                  />
                </svg>
              </div>

              <h1 className="text-center text-2xl font-bold mb-2">
                Support Developer
              </h1>

              <p className="text-center opacity-90 mb-4">
                Your support helps keep this app and the developer&apos;s other
                projects running.
              </p>

              {/* Balance */}

              <p className="text-center text-sm opacity-80 mb-3 font-bold">
                Your Balance: {formattedBalance.toFixed(2)} USDC
              </p>

              {/* Amount Input */}
              <div className="bg-white/20 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-center space-x-2 text-3xl font-bold">
                  <span>$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={handleChange}
                    placeholder="0"
                    className="
                w-28 bg-transparent text-center outline-none
                appearance-none
                [&::-webkit-outer-spin-button]:appearance-none
                [&::-webkit-inner-spin-button]:appearance-none
              "
                  />
                </div>
              </div>

              {/* Presets */}
              <div className="flex justify-between gap-2 mb-6">
                {AMOUNTS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className={`flex-1 rounded-full py-2 font-semibold transition
                ${
                  Number(amount) === v
                    ? "bg-white text-slate-900"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
                  >
                    ${v}
                  </button>
                ))}
              </div>

              {/* Send */}
              <button
                disabled={
                  !isConnected || !hasEnoughBalance || isPending || isConfirming
                }
                onClick={sendUSDC}
                className="
            w-full bg-white text-slate-900 font-bold py-3 rounded-full shadow-md
            hover:scale-[1.02] transition
            disabled:opacity-50 disabled:hover:scale-100
          "
              >
                {!isConnected
                  ? "Connect Wallet"
                  : !hasEnoughBalance
                  ? "Insufficient Balance"
                  : isPending
                  ? "Processing..."
                  : isConfirming
                  ? "Sending..."
                  : isConfirmed
                  ? "Thank you for your support!"
                  : `Send ${amount} USDC`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
