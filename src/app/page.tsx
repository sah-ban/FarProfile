import { Metadata } from "next";
import App from "~/app/app";

const appUrl = process.env.NEXT_PUBLIC_URL;

export const revalidate = 300;

interface Props {
  searchParams: Promise<{
    fid: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { fid } = await searchParams;

  const frame = {
    version: "next",
    imageUrl: fid
      ? `${appUrl}/opengraph-image?fid=${fid}`
      : `${appUrl}/og.png`,
    button: {
      title: `SEE YOUR FarProfile`,
      action: {
        type: "launch_frame",
        name: "FarProfile",
        url: appUrl,
        splashImageUrl: `${appUrl}/logo.png`,
        splashBackgroundColor: "#8660cc",
      },
    },
  };

  return {
    title: "FarProfile",
    openGraph: {
      title: "FarProfile",
      description: "Profile of a farcaster user",
      images: [
        {
          url: `${appUrl}/og.png`,
          width: 1200,
          height: 630,
          alt: "FarProfile by cashlessman.eth",
        },
      ],
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return <App />;
}
