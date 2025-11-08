import React, { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
import { parseUnits, Address } from "viem";
import CheckInStreakABI from "../contracts/streakAbi.json";
import USDCABI from "../contracts/USDC.json";
import { Hash } from "viem";
import { base } from "wagmi/chains";
import sdk from "@farcaster/miniapp-sdk";

const CONTRACT_ADDRESS: Address = "0xE4EE6c6c75066AdFE8a69CC2fc3EAB26D0Be0837";
const USDC_ADDRESS: Address = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const BASE_CHAIN_ID = 8453;
const SECONDS_PER_DAY = 86400;

interface Withdrawable {
  amount: bigint;
  pending: boolean;
}

const CheckInComponent: React.FC = () => {
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const [depositAmount, setDepositAmount] = useState<string>("");
  const [newClaimAmount, setNewClaimAmount] = useState<string>("");
  const [approveHash, setApproveHash] = useState<Hash | undefined>(undefined);

  const { isSuccess: isApproved } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Read lastCheckInDay
  const { data: lastCheckInDay } =
    useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CheckInStreakABI,
      functionName: "getLastCheckInDay",
      args: [address],
      query: { staleTime: 0 },
    }) as { data: bigint | undefined };

  // Read current streak
  const { data: currentStreak, refetch: refetchCurrentStreak } =
    useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CheckInStreakABI,
      functionName: "getCurrentStreak",
      args: [address],
      query: { staleTime: 0 },
    }) as { data: bigint | undefined; refetch: () => void };

  // Read longest streak
  const { data: longestStreak, refetch: refetchLongestStreak } =
    useReadContract({
      address: CONTRACT_ADDRESS,
      abi: CheckInStreakABI,
      functionName: "getLongestStreak",
      args: [address],
      query: { staleTime: 0 },
    }) as { data: bigint | undefined; refetch: () => void };

  // Read withdrawable USDC
  const { data: withdrawable, refetch: refetchWithdrawable } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CheckInStreakABI,
    functionName: "withdrawableUSDC",
    args: [address],
    query: { staleTime: 0 },
  }) as { data: Withdrawable | undefined; refetch: () => void };

  // Read contract's USDC balance
  const { data: contractUsdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDCABI,
    functionName: "balanceOf",
    args: [CONTRACT_ADDRESS],
  }) as { data: bigint | undefined };

  // Calculate if user checked in today
  const currentDay = Math.floor(Date.now() / 1000 / SECONDS_PER_DAY);
  const checkedInToday = lastCheckInDay
    ? Number(lastCheckInDay) === currentDay
    : false;

  // Handle check-in
  const handleCheckIn = async () => {
    if (chainId !== base.id) {
      try {
        await switchChainAsync({ chainId: base.id });
      } catch (switchError) {
        console.error("Failed to switch chain:", switchError);
        throw new Error(
          `Please manually switch to ${base.name} in your wallet.`
        );
      }
    }
    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CheckInStreakABI,
        functionName: "checkIn",
        chainId: BASE_CHAIN_ID,
      });
    } catch (err) {
      console.error("Check-in error:", err);
    }
  };

  // Handle update claim amount (owner only)
  const handleUpdateClaimAmount = async () => {
    try {
      const amount = parseUnits(newClaimAmount || "0", 6);
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CheckInStreakABI,
        functionName: "updateClaimAmount",
        args: [amount],
        chainId: BASE_CHAIN_ID,
      });
    } catch (err) {
      console.error("Update claim amount error:", err);
    }
  };

  // Handle request withdrawal (owner only)
  const handleRequestWithdraw = async () => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CheckInStreakABI,
        functionName: "requestWithdrawAllUSDC",
        chainId: BASE_CHAIN_ID,
      });
      refetchWithdrawable();
    } catch (err) {
      console.error("Request withdrawal error:", err);
    }
  };

  // Handle claim withdrawal
  const handleClaimWithdrawal = async () => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi: CheckInStreakABI,
        functionName: "claimWithdrawal",
        chainId: BASE_CHAIN_ID,
      });
    } catch (err) {
      console.error("Claim withdrawal error:", err);
    }
  };

  // Format USDC amount (6 decimals)
  const formatUSDC = (amount: bigint | undefined): string => {
    if (!amount) return "0";
    return (Number(amount) / 1e6).toFixed(6);
  };

  useEffect(() => {
    if (isConfirmed) {
      sdk.haptics.notificationOccurred("success");
      refetchCurrentStreak();
      refetchLongestStreak();
    }
  }, [isConfirmed, refetchCurrentStreak, refetchLongestStreak]);

  const deposit = async () => {
    if (!depositAmount) return;
    try {
      const amount = parseUnits(depositAmount || "0", 6);
      await writeContract(
        {
          address: USDC_ADDRESS,
          abi: USDCABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESS, amount],
          chainId: BASE_CHAIN_ID,
        },
        {
          onSuccess: (hash: Hash) => {
            setApproveHash(hash);
          },
        }
      );
    } catch (err) {
      console.error("Approval error:", err);
    }
  };

  useEffect(() => {
    if (isApproved && depositAmount) {
      const deposit = async () => {
        try {
          const amount = parseUnits(depositAmount || "0", 6);
          await writeContract({
            address: CONTRACT_ADDRESS,
            abi: CheckInStreakABI,
            functionName: "depositUSDC",
            args: [amount],
            chainId: BASE_CHAIN_ID,
          });
          setDepositAmount("");
          setApproveHash(undefined);
        } catch (err) {
          console.error("Deposit error:", err);
        }
      };
      deposit();
    }
  }, [isApproved, depositAmount, writeContract]);

  return (
    <div className="p-2 rounded-lg text-black text-sm">
      <>
        <div className="flex flex-row justify-between p-2  bg-white rounded-lg shadow">
          <div>
            <p>
              Current Streak: {currentStreak ? Number(currentStreak) : 0}{" "}
              {Number(currentStreak) === 1 ? "day" : "days"}
            </p>
            <p>
              Longest Streak: {longestStreak ? Number(longestStreak) : 0}{" "}
              {Number(longestStreak) === 1 ? "day" : "days"}
            </p>
          </div>

          <button
            onClick={handleCheckIn}
            disabled={isPending || isConfirming || checkedInToday || isConfirmed}
            className="px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
          >
            {isPending
              ? "Processing..."
              : isConfirming
              ? "Checking in..."
              : isConfirmed
              ? "Checked in!"
              : checkedInToday
              ? `Checked in today`
              : "Check in"}
          </button>
        </div>
        {address &&
          address.toLowerCase() ===
            "0x6100B29a235ebb272F4B10c1964AD9692EE67e13".toLowerCase() && (
            <div className="flex flex-col items-center mt-2 p-2 justify-center bg-white rounded-lg shadow">
              <p>
                Balance:{" "}
                {contractUsdcBalance
                  ? Number(formatUSDC(contractUsdcBalance))
                  : "Loading..."}{" "}
                for {Number(formatUSDC(contractUsdcBalance)) * 100} users
              </p>{" "}
              <div className="flex items-center justify-center gap-4">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="USDC"
                  className="p-2 border border-gray-300 rounded-lg w-1/2 md:w-1/3 mb-0"
                />
                <button
                  onClick={deposit}
                  disabled={isPending || isConfirming}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isPending
                    ? "Processing..."
                    : isConfirming
                    ? "Depositing..."
                    : isConfirmed
                    ? "Deposited!"
                    : "Deposit"}
                </button>
              </div>
            </div>
          )}

        {address &&
          address.toLowerCase() ===
            "0x21808EE320eDF64c019A6bb0F7E4bFB3d62F06Ec".toLowerCase() && (
            <div className="p-4 mt-2 bg-white rounded-lg shadow">
              <div className="flex items-center justify-center gap-4">
                <input
                  type="number"
                  value={newClaimAmount}
                  onChange={(e) => setNewClaimAmount(e.target.value)}
                  placeholder="new claim amount"
                  className="p-2 border border-gray-300 rounded-lg w-1/2"
                />
                <button
                  onClick={handleUpdateClaimAmount}
                  disabled={isPending || isConfirming}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isPending
                    ? "Processing..."
                    : isConfirming
                    ? "Updating..."
                    : isConfirmed
                    ? "Updated!"
                    : "Update amount"}
                </button>
              </div>
              <p className="text-gray-600 text-center mt-2">
                Pending Withdrawal: {formatUSDC(withdrawable?.amount)} USDC
              </p>
              <div className="mt-2 align-center flex flex-row justify-center items-center gap-2">
                <button
                  onClick={handleRequestWithdraw}
                  disabled={
                    isPending ||
                    isConfirming ||
                    (withdrawable && withdrawable.pending)
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isPending || isConfirming
                    ? "Processing..."
                    : withdrawable && withdrawable.pending
                    ? "Withdrawal Pending"
                    : "Request Withdraw"}
                </button>

                <button
                  onClick={handleClaimWithdrawal}
                  disabled={isPending || isConfirming}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isPending || isConfirming
                    ? "Processing..."
                    : "Claim Withdrawal"}
                </button>
              </div>
            </div>
          )}
        {isConfirmed && (
          <p className="text-green-600 mt-4 text-center">You can Check in again tommorow</p>
        )}
      </>
    </div>
  );
};

export default CheckInComponent;
