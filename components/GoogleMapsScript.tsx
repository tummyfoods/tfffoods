"use client";

import Script from "next/script";

export default function GoogleMapsScript() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
    <Script
      src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
      strategy="afterInteractive"
      id="google-maps"
      onError={(e) => {
        console.error("Error loading Google Maps script:", e);
      }}
    />
  ) : null;
}
