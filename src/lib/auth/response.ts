import { NextResponse } from "next/server";

export function errorResponse(
  message: string,
  status = 400,
  fields?: Record<string, string[] | undefined>,
) {
  return NextResponse.json(
    { success: false, message, fields },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
