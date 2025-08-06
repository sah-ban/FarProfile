import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  
  try {
    const lastfidApiUrl = `${process.env.NEXT_PUBLIC_HubUrl}/v1/fids?pageSize=1&reverse=true&shard_id=2`;
    const lastFidResponse = await axios.get(lastfidApiUrl);

    return NextResponse.json({
      lastFid: lastFidResponse.data.fids[0],
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
