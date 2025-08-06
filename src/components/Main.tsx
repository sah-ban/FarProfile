"use client";

import { useEffect, useCallback, useState } from "react";
import sdk, { type Context } from "@farcaster/frame-sdk";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useConnect,
} from "wagmi";
import { encodeFunctionData } from "viem";
import { abi } from "../contracts/abi";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { config } from "~/components/providers/WagmiProvider";
import { truncateAddress } from "~/lib/truncateAddress";
import { BaseError, UserRejectedRequestError } from "viem";

export default function Main() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [refid, setRefid] = useState<string | undefined>();

  const { isConnected } = useAccount();

  const {
    sendTransaction,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });
  const { connect } = useConnect();

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);

      sdk.actions.ready({});
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

  interface ProfileResponse {
    pfpUrl: string;
    username: string;
    display_name: string;
    fids: string;
    followingcount: string;
    followerscount: string;
  }

  interface TimeResponse {
    timestamp: string;
  }
  interface LFidResponse {
    lastFid: string;
  }
  const [profileData, setProfileData] = useState<ProfileResponse>();

  const Profile = useCallback(async (fid: string) => {
    try {
      const response = await fetch(`/api/profile?fid=${fid}`);
      if (!response.ok) {
        throw new Error(`Fid HTTP error! Status: ${response.status}`);
      }
      const profileResponseData = await response.json();
      setProfileData({
        pfpUrl: profileResponseData.pfpUrl,
        username: profileResponseData.username,
        display_name: profileResponseData.display_name,
        fids: profileResponseData.fids,
        followingcount: profileResponseData.followCount,
        followerscount: profileResponseData.followerscount,
      });
    } catch (err) {
      console.error("Error fetching profile data", err);
    }
  }, []);

  const [timeData, setTimeData] = useState<TimeResponse>();

  const accountCreated = useCallback(async (fid: string) => {
    try {
      const response = await fetch(`/api/timeCreated?fid=${fid}`);
      if (!response.ok) {
        throw new Error(`Fid HTTP error! Status: ${response.status}`);
      }
      const timeResponseData = await response.json();
      setTimeData({
        timestamp: timeResponseData.timestamp,
      });
    } catch (err) {
      console.error("Error fetching account creation date", err);
    }
  }, []);

  const [LFidData, setLFidData] = useState<LFidResponse>();

  const LastFid = useCallback(async () => {
    try {
      const response = await fetch(`/api/lastFID`);
      if (!response.ok) {
        throw new Error(`Fid HTTP error! Status: ${response.status}`);
      }
      const FidResponseData = await response.json();
      setLFidData({
        lastFid: FidResponseData.lastFid,
      });
    } catch (err) {
      console.error("Error fetching most recent FID", err);
    }
  }, []);

  useEffect(() => {
    if (!context?.client.added) {
      sdk.actions.addFrame();
    }
  }, [context?.client.added]);

  const searchParams = useSearchParams();
  const castFid = searchParams.get("castFid");
  useEffect(() => {
    if (castFid) {
      setRefid(castFid);
    }
  }, [context]);

  useEffect(() => {
    if (context?.user.fid && !castFid) {
      Profile(String(context.user.fid));
      accountCreated(String(context.user.fid));
      LastFid();
    }
  }, [context?.user.fid]);
  useEffect(() => {
    if (refid) {
      Profile(String(refid));
      accountCreated(String(refid));
      LastFid();
    }
  }, [refid]);

  const user =
    refid && refid !== String(context?.user.fid)
      ? `@${profileData?.username}`
      : "I";
  const users =
    refid && refid !== String(context?.user.fid)
      ? `@${profileData?.username}`
      : "me";

  const cast = async (): Promise<string | undefined> => {
    try {
      const result = await sdk.actions.composeCast({
        text: `${user} joined Farcaster on ${formattedDate}, which was ${timeAgo} ago.\nSince then, ${percent} percent of users have joined after ${users}\nminiapp by @cashlessman.eth`,
        embeds: [`https://far-profile.vercel.app/?fid=${profileData?.fids}`],
      });

      return result.cast?.hash;
    } catch (error) {
      console.error("Error composing cast:", error);
      return undefined;
    }
  };

  const timestamp = Number(timeData?.timestamp);

  const formattedDate = formatDate(timestamp);
  const timeAgo = getTimeAgo(timestamp);

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const daySuffix = getDaySuffix(date.getDate());
    const day = date.getDate() + daySuffix;
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  function getDaySuffix(day: number): string {
    if (day > 3 && day < 21) return "th"; // Catch 11th-13th
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }

  function getTimeAgo(timestamp: number): string {
    const now = new Date();
    const past = new Date(timestamp * 1000);

    let years = now.getFullYear() - past.getFullYear();
    let months = now.getMonth() - past.getMonth();
    let days = now.getDate() - past.getDate();

    if (days < 0) {
      months -= 1;
      const previousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += previousMonth.getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const timeAgoParts = [];
    if (years > 0) {
      timeAgoParts.push(`${years} year${years > 1 ? "s" : ""}`);
    }
    if (months > 0 || years > 0) {
      timeAgoParts.push(`${months} month${months > 1 ? "s" : ""}`);
    }
    if (days > 0 || months > 0 || years > 0) {
      timeAgoParts.push(`${days} day${days > 1 ? "s" : ""}`);
    }

    return timeAgoParts.length > 0 ? timeAgoParts.join(", ") : "just now";
  }

  const percent = (
    (Number(Number(LFidData?.lastFid) - Number(profileData?.fids)) /
      Number(LFidData?.lastFid)) *
    100
  ).toFixed(1);

  if (!context?.user.fid)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="flex flex-col items-center justify-center text-white text-2xl p-4">
          <p className="flex items-center justify-center text-center">
            you need to access this miniapp from inside a farcaster client
          </p>
          <p className="flex items-center justify-center text-center">
            (click on the logo to open in Farcaster)
          </p>

          <div className="flex items-center justify-center p-2 bg-white rounded-lg mt-4">
            <a
              href="https://farcaster.xyz/cashlessman.eth/0xcaf78007"
              target="_blank"
              rel="noopener noreferrer"
              className="shadow-lg shadow-white"
            >
              <img
                src="https://warpcast.com/og-logo.png"
                alt="Profile"
                className="w-28 h-28 shadow-lg"
              />
            </a>
          </div>
        </div>
      </div>
    );
  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <div className="flex flex-col w-full min-h-screen bg-gradient-to-br from-[#6B4EFF] to-[#8C52FF] text-[#FFDEAD] items-center justify-center p-6">
        <Search />

        <div className="bg-white bg-opacity-10 p-6 rounded-2xl shadow-lg flex flex-col items-center text-center mt-10 w-full max-w-md">
          <img
            src={profileData?.pfpUrl}
            alt="Profile"
            className="w-28 h-28 rounded-full border-4 border-white shadow-lg"
          />
          <div className="mt-4">
            <h2 className="text-2xl font-extrabold text-white">
              {profileData?.display_name}
            </h2>
            <p className="text-lg text-gray-300">@{profileData?.username}</p>
          </div>
          <div className="flex justify-around w-full mt-4">
            <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
              <span className="text-lg font-bold text-white">
                {profileData?.followingcount}
              </span>
              <p className="text-gray-300 text-sm">Following</p>
            </div>
            <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
              <span className="text-lg font-bold text-white">
                {profileData?.followerscount}
              </span>
              <p className="text-gray-300 text-sm">Followers</p>
            </div>
          </div>
        </div>
        <div className="bg-white bg-opacity-10 p-4 rounded-2xl shadow-lg mt-6 text-center w-full max-w-md">
          <p className="text-lg text-white">Joined Farcaster on</p>
          <p className="text-xl font-semibold text-[#FFDEAD] mt-1">
            {formattedDate}
          </p>
          <p className="text-md text-gray-300 mt-1">{timeAgo} ago</p>
          <p className="text-md text-gray-200 mt-2 font-bold">
            {(
              ((Number(LFidData?.lastFid) - Number(profileData?.fids)) /
                Number(LFidData?.lastFid)) *
              100
            ).toFixed(1)}
            % of users joined after {refid ? profileData?.username : "you"}
          </p>
        </div>
        <p className="text-lg text-white m-3 flex items-center">
          Latest registered FID:{" "}
          <span className="font-semibold text-[#FFDEAD] ml-2">
            {LFidData?.lastFid}
          </span>
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-2"></span>
        </p>
        <Mint />
      </div>
    </div>
  );

  function Search() {
    const [searchValue, setSearchValue] = useState("");

    const usernameToFid = useCallback(
      async (searchValue: string) => {
        try {
          const username = searchValue.includes("@")
            ? searchValue.replace("@", "")
            : searchValue;

          const apiUrl = `${process.env.NEXT_PUBLIC_HubUrl}/v1/userNameProofByName?name=${username}`;
          const pinataResponse = await axios.get(apiUrl);
          const searchFid = pinataResponse.data.fid;

          setRefid(searchFid);
        } catch {
          alert("please enter a valid username");
          // console.error('Error fetching data:', error);
        }
      },
      [searchValue]
    );
    return (
      <div className="absolute top-0 flex flex-row w-full items-center justify-between bg-gradient-to-r from-[#6B4EFF] to-[#8C52FF] p-3 border-b border-white/20 shadow-md">
        <div className="flex items-center gap-3">
          <input
            className="w-[200px] p-2 bg-white/20 text-white text-base rounded-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-[#FFDEAD] placeholder-white/80"
            type="text"
            placeholder="Search for a username"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                usernameToFid(searchValue);
              }
            }}
          />
          <div
            className="bg-white/20 hover:bg-white/30 transition p-2 rounded-xl flex items-center justify-center cursor-pointer"
            onClick={() => usernameToFid(searchValue)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="white"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </div>
        </div>

        <div
          className="bg-white/20 hover:bg-white/30 transition p-2 rounded-xl flex items-center justify-center cursor-pointer"
          onClick={() => cast()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="white"
            className="w-6 h-6"
          >
            <path
              fillRule="evenodd"
              d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    );
  }
  function Mint() {
    const [isClicked, setIsClicked] = useState(false);

    const CONTRACT_ADDRESS = "0x710EECB609366b70B0b2649ac3c2337a260D414C";
    const handleMint = () => {
      setIsClicked(true);
      setTimeout(() => {
        if (isConnected) {
          sendTx();
        } else {
          connect({ connector: config.connectors[0] });
        }
      }, 500);

      setTimeout(() => setIsClicked(false), 500);
    };
    const sendTx = useCallback(() => {
      const data = encodeFunctionData({
        abi,
        functionName: "mintNFT",
        args: [context?.user.fid],
      });
      sendTransaction(
        {
          to: CONTRACT_ADDRESS,
          data,
          value: BigInt(300000000000000), // 0.0003 ETH
        },
        {
          onSuccess: (hash) => {
            setTxHash(hash);
          },
        }
      );
    }, [sendTransaction]);
    return (
      <div className="flex flex-col">
        <button
          onClick={handleMint}
          disabled={isSendTxPending}
          className="text-white text-center py-3 rounded-xl font-semibold text-lg shadow-lg relative overflow-hidden transform transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center gap-2"
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
          {isConnected ? <MintButton /> : "Connect Wallet"}
        </button>
        <div className="text-center">
          {isSendTxError && renderError(sendTxError)}
          {txHash && (
            <div className="mt-2 text-xs">
              <div>Hash: {truncateAddress(txHash)}</div>
              <div>
                Status:{" "}
                {isConfirming
                  ? "Confirming..."
                  : isConfirmed
                  ? "Confirmed!"
                  : "Pending"}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  function MintButton() {
    return (
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
        </svg>
        <span className="relative z-10">Mint your FarProfile</span>
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
    );
  }
}

const renderError = (error: Error | null) => {
  if (!error) return null;
  if (error instanceof BaseError) {
    const isUserRejection =
      error instanceof UserRejectedRequestError ||
      (error.cause && error.cause instanceof UserRejectedRequestError);

    if (isUserRejection) {
      return <div className="text-red-500 text-xs mt-1">Rejected by user.</div>;
    }
  }

  return <div className="text-red-500 text-xs mt-1">{error.message}</div>;
};
