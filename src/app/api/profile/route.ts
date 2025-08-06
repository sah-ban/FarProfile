import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get("fid");

  try {
    const apiUrl = `https://api.farcaster.xyz/v2/user?fid=${fid}`;
    const response = await axios.get(apiUrl);

    const pfpUrl = response.data?.result?.user?.pfp?.url;
    const username = response.data?.result?.user?.username;
    const display_name = response.data?.result?.user?.displayName;
    const fids = response.data?.result?.user?.fid;
    const followerscount = response.data?.result?.user?.followerCount;
    const followCount = response.data?.result?.user?.followingCount;

    return NextResponse.json({
      pfpUrl,
      username,
      display_name,
      fids,
      followerscount,
      followCount,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
