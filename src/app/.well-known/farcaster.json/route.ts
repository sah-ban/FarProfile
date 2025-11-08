export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL;

  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjI2ODQzOCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDIxODA4RUUzMjBlREY2NGMwMTlBNmJiMEY3RTRiRkIzZDYyRjA2RWMifQ",
      payload: "eyJkb21haW4iOiJwcm9maWxlLml0c2Nhc2hsZXNzLmNvbSJ9",
      signature:
        "7sAQEue8gL0l3PJRknyejkptB6v3Jo4Bk8uhZFFOaGhU+kOcdY4j3+wB+R9ot2y5nbgUIxcvyS5HozGsRPHxdRw=",
    },
    frame: {
      version: "1",
      name: "FarProfile",
      iconUrl: `${appUrl}/logo.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/og.png`,
      buttonTitle: "FarProfile",
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#8660cc",
      webhookUrl: `${appUrl}/api/webhook`,
      castShareUrl: appUrl,
      primaryCategory: "social",
      subtitle: "Farprofile - Farcaster Profile",
      description:
        "user's profile information.",
      ogImageUrl: `${appUrl}/og.png`,
      tags: ["farcaster", "profile", "account", "created", "farprofile"],
      heroImageUrl: `${appUrl}/og.png`,
      tagline: "Discover your Farcaster Profiles",
      ogTitle: "FarProfile - Farcaster Profile",
      ogDescription:
        "user's profile information.",
      requiredChains: ["eip155:8453"],
      baseBuilder: {
        allowedAddresses: ["0x06e5B0fd556e8dF43BC45f8343945Fb12C6C3E90"],
      },
    },
  };

  return Response.json(config);
}
