import { NextResponse } from "next/server";
import { isCursorAvailable } from "@/lib/cursor-auth";

export async function GET() {
  return NextResponse.json({ available: isCursorAvailable() });
}
