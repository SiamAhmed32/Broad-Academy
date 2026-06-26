"use client";

import dynamic from "next/dynamic";

const SiteOfferPopup = dynamic(() => import("./SiteOfferPopup"), {
  ssr: false,
  loading: () => null,
});

export default function SiteOfferPopupLoader() {
  return <SiteOfferPopup />;
}
