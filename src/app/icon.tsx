import { ImageResponse } from "next/og";
import { APP_ICON_SIZES, AppIconMark, type AppIconId } from "@/lib/brand/app-icon-mark";

export function generateImageMetadata() {
  return (Object.keys(APP_ICON_SIZES) as AppIconId[]).map((id) => ({
    id,
    contentType: "image/png",
    size: { width: APP_ICON_SIZES[id], height: APP_ICON_SIZES[id] },
    alt: "Taara Jyotishyam",
  }));
}

export default async function Icon({ id }: { id: Promise<AppIconId> }) {
  const iconId = await id;
  const size = APP_ICON_SIZES[iconId] ?? 32;
  const variant = iconId === "512-maskable" ? "maskable" : "default";

  return new ImageResponse(
    <AppIconMark size={size} variant={variant} />,
    { width: size, height: size },
  );
}
