import { NextResponse } from "next/server";
import {
  Message,
  NobleEd25519Signer,
  CastAddBody,
  makeCastAdd,
} from "@farcaster/core";
import { hexToBytes } from "@noble/hashes/utils";
import axios from "axios";

const appUrl = process.env.NEXT_PUBLIC_URL;
let lfid: string = "";

const timeAgo = getTimeAgo(1706981726);

const lresponse = await axios.get(`${appUrl}/api/lastFID`);
lfid = lresponse.data.lastFid;

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

const text = `I joined Farcaster on 3rd February 2024, which was ${timeAgo} ago.\nSince then, ${(
  (Number(Number(lfid) - Number(268438)) / Number(lfid)) *
  100
).toFixed(1)}% users joined after me.`;

const fid = 268438;
const SIGNER = process.env.PRIVATE_KEY || "";

export async function GET() {
  try {
    const dataOptions = {
      fid,
      network: 1,
    };

    const privateKeyBytes = hexToBytes(SIGNER);
    const ed25519Signer = new NobleEd25519Signer(privateKeyBytes);

    const castBody: CastAddBody = {
      text,
      embeds: [{ url: "https://far-profile.vercel.app?fid=268438" }],
      embedsDeprecated: [],
      mentions: [],
      mentionsPositions: [],
      type: 0,
    };

    const castAddReq = await makeCastAdd(castBody, dataOptions, ed25519Signer);
    const castAdd = castAddReq._unsafeUnwrap();

    const messageBytes = Buffer.from(Message.encode(castAdd).finish());

    const castRequest = await fetch(
      `${process.env.NEXT_PUBLIC_HubUrl}/v1/submitMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: messageBytes,
      }
    );

    if (!castRequest.ok) {
      const errorText = await castRequest.text();
      return NextResponse.json(
        { error: errorText },
        { status: castRequest.status }
      );
    }

    const result = await castRequest.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error sending cast:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
