"use client";

import { useEffect, useCallback, useState } from "react";
import Image from "next/image";
import sdk, { type Context } from "@farcaster/miniapp-sdk";
import { useAccount } from "wagmi";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import Toast from "./Toast";
import Connect from "./Connect";
// import MintButton from "./MintButton";
import LoadingScreen from "./Loading";
import CheckInComponent from "./streak";

export default function Main() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.MiniAppContext>();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [fid, setFid] = useState<number | undefined>(undefined);

  const { isConnected } = useAccount();

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

  interface Wallet {
    address: string;
    labels?: string[];
  }

  type Profile = {
    fid: number;
    username: string;
    displayName: string;
    bio: string;
    location: string;
    followerCount: number;
    followingCount: number;
    pfp: {
      url: string;
      verified: boolean;
    };
    accountLevel: string;
    wallets: Wallet[]; // 👈 added wallet list
  };

  interface TimeResponse {
    timestamp: string;
  }
  interface LFidResponse {
    lastFid: string;
  }
  const [profile, setProfile] = useState<Profile | null>(null);
  const [timeData, setTimeData] = useState<TimeResponse>();
  const [LFidData, setLFidData] = useState<LFidResponse>();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingTime, setLoadingTime] = useState(false);
  const [loadingLFid, setLoadingLFid] = useState(false);

  const loading = loadingProfile || loadingTime || loadingLFid;

  async function fetchProfile(fid: number) {
    try {
      setLoadingProfile(true);
      const res = await fetch(`/api/profile?fid=${fid}`);
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function accountCreated(fid: string) {
    try {
      setLoadingTime(true);
      const res = await fetch(`/api/timeCreated?fid=${fid}`);
      const data = await res.json();
      setTimeData({ timestamp: data.timestamp });
    } catch (err) {
      console.error("Error fetching account creation date:", err);
    } finally {
      setLoadingTime(false);
    }
  }

  async function LastFid() {
    try {
      setLoadingLFid(true);
      const res = await fetch(`/api/lastFID`);
      const data = await res.json();
      setLFidData({ lastFid: data.lastFid });
    } catch (err) {
      console.error("Error fetching most recent FID:", err);
    } finally {
      setLoadingLFid(false);
    }
  }

  const searchParams = useSearchParams();
  const castFid = searchParams.get("castFid");

  useEffect(() => {
    if (castFid) {
      setFid(Number(castFid));
    } else if (context?.user?.fid) {
      setFid(context.user.fid);
    }
  }, [context, castFid]);

  useEffect(() => {
    if (fid) {
      fetchProfile(fid);
      accountCreated(String(fid));
    }
  }, [fid]);

  useEffect(() => {
    LastFid();
  }, []);

  const user = context?.user?.fid !== fid ? `@${profile?.username}` : "I";
  const users = context?.user?.fid !== fid ? `@${profile?.username}` : "me";

  const cast = async (): Promise<string | undefined> => {
    try {
      const result = await sdk.actions.composeCast({
        text: `${user} joined Farcaster on ${formattedDate}, which was ${timeAgo} ago.\nSince then, ${percent} percent of users have joined after ${users}\nminiapp by @cashlessman.eth`,
        embeds: [`${process.env.NEXT_PUBLIC_URL}/?fid=${fid}`],
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
    (Number(Number(LFidData?.lastFid) - Number(fid)) /
      Number(LFidData?.lastFid)) *
    100
  ).toFixed(1);

  const [copied, setCopied] = useState<string | null>(null);

  const shorten = (address: string) =>
    address.length > 12
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : address;

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(address);
    setTimeout(() => setCopied(null), 1500);
  };

  const openInterface = (address: string) => {
    sdk.actions.openUrl(`https://app.interface.social/${address}`);
  };

  if (!context)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="flex flex-col items-center justify-center text-white text-2xl p-4">
          <p className="flex items-center justify-center text-center">
            You need to access this mini app from inside a farcaster client
          </p>
          <div
            className="flex items-center justify-center text-center bg-indigo-800 p-3 rounded-lg mt-4 cursor-pointer"
            onClick={() =>
              window.open(
                "https://farcaster.xyz/miniapps/MoA1BK1RvAsY/farprofile",
                "_blank"
              )
            }
          >
            Open in Farcaster
          </div>
        </div>
      </div>
    );

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <Connect />
      </div>
    );
  }

  if (loading) return <LoadingScreen />;

  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
        height: "100vh",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div className="w-auto bg-slate-900 flex flex-col h-full">
        <header>
          <Search />
        </header>

        <main className="flex-grow overflow-auto mx-2">
          {showToast && (
            <Toast message={toastMessage} onClose={() => setShowToast(false)} />
          )}

          <div className="max-w-sm border p-4 rounded-2xl shadow-md bg-[#16101e] text-white mt-2">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Image
                  src={profile?.pfp?.url ?? "https://farcaster.xyz/avatar.png"}
                  alt={profile?.displayName ?? "avatar"}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full border"
                  unoptimized
                />
                {profile?.accountLevel && (
                  <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5">
                    <Image
                      src="/verified.svg"
                      alt="Verified"
                      width={14}
                      height={14}
                      className="w-3.5 h-3.5"
                      unoptimized
                    />
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-lg font-bold">{profile?.displayName}</h2>
                <p className="text-gray-300">@{profile?.username}</p>
              </div>
            </div>

            {/* Bio */}
            {profile?.bio && (
              <p className="mt-3 text-sm whitespace-pre-line">{profile.bio}</p>
            )}

            {/* Location */}
            {profile?.location && (
              <p className="mt-2 text-xs text-gray-600">
                📍 {profile?.location}
              </p>
            )}

            {/* Stats */}
            <div className="flex space-x-6 mt-3 text-sm">
              <p>
                <span className="font-semibold">{profile?.followingCount}</span>{" "}
                Following
              </p>
              <p>
                <span className="font-semibold">{profile?.followerCount}</span>{" "}
                Followers
              </p>
              <p>
                <span className="font-semibold">{fid ?? "loading"}</span> FID
              </p>
            </div>
          </div>

          <div className="w-full max-w-md mt-3 p-3 rounded-2xl text-center bg-white/8 backdrop-blur-lg backdrop-saturate-150 border border-white/20 shadow-lg">
            <p className="text-base text-white">Joined Farcaster on</p>
            <p className="text-lg font-semibold text-[#FFDEAD] mt-1">
              {formattedDate}
            </p>
            <p className="text-base text-gray-300 mt-1">{timeAgo} ago</p>
            <p className="text-md text-gray-200 mt-2 font-bold">
              {(
                ((Number(LFidData?.lastFid) - Number(fid)) /
                  Number(LFidData?.lastFid)) *
                100
              ).toFixed(1)}
              % of users joined after{" "}
              {context?.user?.fid !== fid ? profile?.username : "you"}
            </p>
          </div>
          {profile?.wallets && profile.wallets.length > 0 && (
            <div className="bg-[#16101e] p-3 rounded-2xl shadow-lg mt-3 text-center w-full max-w-md border">
              <ul>
                {profile?.wallets?.map((w, i: number) => (
                  <li
                    key={i}
                    className="flex items-center justify-between border-b p-2 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCopy(w.address)}
                        className="text-xs text-white"
                        title="Copy address"
                      >
                        {copied === w.address ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="size-6"
                          >
                            <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 0 1 3.75 3.75v1.875C13.5 8.161 14.34 9 15.375 9h1.875A3.75 3.75 0 0 1 21 12.75v3.375C21 17.16 20.16 18 19.125 18h-9.75A1.875 1.875 0 0 1 7.5 16.125V3.375Z" />
                            <path d="M15 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 17.25 7.5h-1.875A.375.375 0 0 1 15 7.125V5.25ZM4.875 6H6v10.125A3.375 3.375 0 0 0 9.375 19.5H16.5v1.125c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V7.875C3 6.839 3.84 6 4.875 6Z" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="size-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                            />
                          </svg>
                        )}
                      </button>

                      <span className="font-mono text-sm text-white">
                        {shorten(w.address)}
                      </span>

                      {w.labels && w.labels.length > 0 && (
                        <span className="flex gap-2">
                          {w.labels.map((label: string, idx: number) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded-xl text-white text-xs font-semibold ${
                                label.toLowerCase() === "primary"
                                  ? "bg-green-500"
                                  : label.toLowerCase() === "warpcast"
                                  ? "bg-[#8660cc]"
                                  : "bg-gray-500"
                              }`}
                            >
                              {label}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => openInterface(w.address)}
                      className="w-6 h-6 flex-shrink-0"
                      title="Open in Interface"
                    >
                      <Image
                        src="/interface.png"
                        alt="icon"
                        width={24}
                        height={24}
                        className="w-6 h-6 object-contain rounded-lg"
                        unoptimized
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
        {context?.client.clientFid === 9152 && (
          <footer>
            <CheckInComponent />
          </footer>
        )}

        {/* <MintButton fid={context.user.fid} /> */}
      </div>
    </div>
  );

  function Search() {
    const [searchValue, setSearchValue] = useState("");

    const usernameToFid = useCallback(async (searchValue: string) => {
      try {
        const username = searchValue.includes("@")
          ? searchValue.replace("@", "")
          : searchValue;

        const apiUrl = `${process.env.NEXT_PUBLIC_HubUrl}/v1/userNameProofByName?name=${username}`;
        const response = await axios.get(apiUrl);
        const searchFid = response.data.fid;

        setFid(searchFid);
      } catch {
        setToastMessage("Please enter a valid username");
        setShowToast(true);
        // console.error('Error fetching data:', error);
      }
    }, []);
    return (
      <div className="flex flex-row w-full items-center justify-between bg-slate-900 p-2 border-b border-white/20 shadow-md">
        <div className="flex items-center gap-3">
          <input
            className="w-[220px] p-2 bg-white/20 text-white text-base rounded-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-[#FFDEAD] placeholder-white/80"
            type="text"
            placeholder="Search for username"
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
          onClick={() =>
            sdk.actions.viewCast({
              hash: "0xaba31427ae981da207271a59e9e42aebd3c969af",
            })
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="white"
            viewBox="0 0 24 24"
            className="w-6 h-6"
          >
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.478 2 12s4.477 10 10 10 10-4.478 10-10S17.523 2 12 2Zm0 5a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V8a1 1 0 0 1 1-1Zm0 10.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div
          className="bg-white/20 hover:bg-white/30 transition p-2 rounded-xl flex items-center justify-center cursor-pointer"
          onClick={cast}
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
}
