import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

interface WalletLabel {
  address: string;
  labels: string[];
}

export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "fid is required" }, { status: 400 });
  }

  try {
    const apiUrl = `https://api.farcaster.xyz/v2/user?fid=${fid}`;
    const response = await axios.get(apiUrl);

    const user = response.data?.result?.user;
    const extras = response.data?.result?.extras;

    const ethWallets: string[] = extras?.ethWallets || [];
    const walletLabels: WalletLabel[] = extras?.walletLabels || [];

    const allEthWallets = walletLabels
      .filter((wallet) => wallet.address.startsWith("0x"))
      .map((wallet) => ({
        address: wallet.address,
        labels: wallet.labels,
      }));

    const labeledAddresses = new Set(walletLabels.map((w) => w.address));
    ethWallets
      .filter((addr) => !labeledAddresses.has(addr))
      .forEach((addr) =>
        allEthWallets.push({
          address: addr,
          labels: [],
        })
      );
    return NextResponse.json({
      fid: user?.fid,
      username: user?.username,
      displayName: user?.displayName,
      bio: user?.profile?.bio?.text,
      location: user?.profile?.location?.description,
      followerCount: user?.followerCount,
      followingCount: user?.followingCount,
      pfp: user?.pfp,
      accountLevel: user?.profile?.accountLevel,
      wallets: allEthWallets, 
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
