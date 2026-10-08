"use client";

import { Slide, ToastContainer } from "react-toastify";

/** Site-wide toast outlet, mounted once in the root layout. Colours live in globals.css. */
export default function AppToaster() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      theme="colored"
      transition={Slide}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss={false}
      limit={3}
    />
  );
}
