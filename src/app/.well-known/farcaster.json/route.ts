export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL;

  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjI2ODQzOCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDIxODA4RUUzMjBlREY2NGMwMTlBNmJiMEY3RTRiRkIzZDYyRjA2RWMifQ",
      payload: "eyJkb21haW4iOiJmYXItcHJvZmlsZS52ZXJjZWwuYXBwIn0",
      signature:
        "MHg3NDQ4MTFlMDY5MDQ1NTAzYTIxNTQ2NTEwMGYxOGY3NmViZDI0NmRhMTJjZTM3M2I3NWJkNWVlNmFmNTRjNmE3MThjMDA1NTZlYTQ1OGQyNDBjNzJmNzE1NWY1N2ViNGRjZGM0NDY0Nzk1ODhmNzg1YzEyYzZiZDlkY2M2NGFhNDFi",
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
      baseBuilder: {
        allowedAddresses: ["0x06e5B0fd556e8dF43BC45f8343945Fb12C6C3E90"],
      },
    },
  };

  return Response.json(config);
}
