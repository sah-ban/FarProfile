import { NextResponse } from "next/server";
import axios from "axios";

export const revalidate = 172800; // 48 hours in seconds (2 days)

export async function GET() {
  try {
    const lastfidApiUrl = `${process.env.NEXT_PUBLIC_HubUrl}/v1/fids?pageSize=1&reverse=true&shard_id=2`;
    const lastFidResponse = await axios.get(lastfidApiUrl);

    const res = NextResponse.json({
      lastFid: lastFidResponse.data.fids[0],
    });

    res.headers.set("Cache-Control", "public, s-maxage=172800, stale-while-revalidate=3600");

    return res;
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
