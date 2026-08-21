import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Your Home — Houses for Sale, Rent & BnB across Africa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background:
            "linear-gradient(135deg, #071a14 0%, #0b6e4f 55%, #0f766e 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: 36,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            ⌂
          </div>
          Your Home
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: 900,
            }}
          >
            Find your perfect home in Africa
          </div>
          <div style={{ fontSize: 28, opacity: 0.9, maxWidth: 820 }}>
            Verified houses, apartments, land, rentals & BnB stays —
            Kenya to Lagos, Accra, Cape Town & beyond
          </div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.85 }}>yourhome.co.ke</div>
      </div>
    ),
    { ...size },
  );
}
