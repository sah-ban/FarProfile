export async function GET(request: Request) {
  const domain = request.headers.get("host")?.split(":")[0] || "";
  const appUrl = process.env.NEXT_PUBLIC_URL;

  const oldDomain = "profile.itscashless.com";

  const oldAccountAssociation = {
    header:
      "eyJmaWQiOjI2ODQzOCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDIxODA4RUUzMjBlREY2NGMwMTlBNmJiMEY3RTRiRkIzZDYyRjA2RWMifQ",
    payload: "eyJkb21haW4iOiJwcm9maWxlLml0c2Nhc2hsZXNzLmNvbSJ9",
    signature:
      "7sAQEue8gL0l3PJRknyejkptB6v3Jo4Bk8uhZFFOaGhU+kOcdY4j3+wB+R9ot2y5nbgUIxcvyS5HozGsRPHxdRw=",
  };

  const newAccountAssociation = {
    header:
      "eyJmaWQiOjI2ODQzOCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDIxODA4RUUzMjBlREY2NGMwMTlBNmJiMEY3RTRiRkIzZDYyRjA2RWMifQ",
    payload: "eyJkb21haW4iOiJmYXJwcm9maWxlLnNhaGJhbi5kZXYifQ",
    signature:
      "lJTgFyPqBi4I7qILmLP7WJoTXm59fLTIwPBrrEOMpZ9gQxT7LHuEYD7MAaAykiXgw91WRR6y7o8lT2/zTyY3Uxs=",
  };

  const accountAssociation =
    domain === oldDomain ? oldAccountAssociation : newAccountAssociation;

  const config = {
    accountAssociation,
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
      tagline: "Farcaster Profile",
      ogTitle: "FarProfile - Farcaster Profile",
      canonicalDomain: "farprofile.sahban.dev",
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
