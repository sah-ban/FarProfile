import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "Missing token ID" }, { status: 400 });
  }

  return NextResponse.json({
    name: "FarProfile",
    description: `FarProfile of FID: ${fid}`,
    image: `${process.env.NEXT_PUBLIC_URL}/nft?fid=${fid}`,
    attributes: [{ trait_type: "FID", value: fid }],
  });
}
