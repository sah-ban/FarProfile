import { NextRequest } from "next/server";
import axios from "axios";
import { ImageResponse } from "@vercel/og";

export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get("fid");
  const appUrl = process.env.NEXT_PUBLIC_URL;

  let pfpUrl: string = "";
  let username: string = "";
  let display_name: string = "";
  let time: string = "";
  let lfid: string = "";

  try {
    const fapiUrl = `https://fnames.farcaster.xyz/transfers?fid=${fid}`;
    const fresponse = await axios.get(fapiUrl);
    time = fresponse.data.transfers[0].timestamp;

    const lresponse = await axios.get(`${appUrl}/api/lastFID`);
    lfid = lresponse.data.lastFid;

    const timestamp = Number(time);

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
      if (day > 3 && day < 21) return "th";
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
        const previousMonth = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of the previous month
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

    const apiUrl = `https://api.farcaster.xyz/v2/user?fid=${fid}`;
    const response = await axios.get(apiUrl);
    pfpUrl = response.data?.result?.user?.pfp?.url;
    username = response.data?.result?.user?.username;
    display_name = response.data?.result?.user?.displayName;

    const imageResponse = new ImageResponse(
      (
        <div tw="flex flex-col w-full h-full bg-[#8660cc] text-2xl justify-center text-[#00FFFF]">
          <div tw="flex items-center justify-center text-white">
            <img src={pfpUrl} alt="Profile" tw="w-15 h-15 rounded-lg mr-4" />
            <div tw="flex flex-col">
              <span tw="flex text-xl">{display_name}</span>
              <span tw="flex text-xl">@{username}</span>{" "}
            </div>
          </div>

          <div tw="flex flex-col items-center mt-7">
            <span tw="flex text-xl">Joined Farcaster on</span>

            <span tw="flex mt-2 font-bold">{formattedDate} </span>

            <span tw="flex mt-3"> {timeAgo} ago</span>
            <span tw="flex mt-3 text-2xl">
              {(
                (Number(Number(lfid) - Number(fid)) / Number(lfid)) *
                100
              ).toFixed(1)}
              % users joined after {username}
            </span>
          </div>

          <div tw="flex bg-[#FFDEAD] mt-1 text-black w-full justify-end text-sm mt-6">
            <div tw="flex pr-10">miniapp by cashlessman.eth</div>
          </div>
        </div>
      ),
      {
        width: 600,
        height: 400,
      }
    );
    const headers = new Headers(imageResponse.headers);
    headers.set(
      "Cache-Control",
      "public, s-maxage=3000, stale-while-revalidate=59"
    );

    return new Response(imageResponse.body, {
      headers,
      status: imageResponse.status,
      statusText: imageResponse.statusText,
    });
  } catch {
    return new Response("Failed to generate image", {
      status: 500,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}
