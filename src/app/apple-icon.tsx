import { ImageResponse } from "next/og";
import { AppIconMark } from "@/lib/brand/app-icon-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home screen icon — 180×180 px. */
export default function AppleIcon() {
  return new ImageResponse(<AppIconMark size={180} />, size);
}
