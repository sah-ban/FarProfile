import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "Missing token ID" }, { status: 400 });
  }

  return NextResponse.json({
    name: `FarProfile of FID:${fid}`,
    description: "An NFT of FarProfile",
    image: `https://far-profile.vercel.app/nft?fid=${fid}`,
    attributes: [{ trait_type: "FID", value: fid }],
  });
}
