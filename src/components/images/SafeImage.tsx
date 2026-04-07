import NextImage, { type ImageProps } from "next/image";
import { shouldUnoptimizeRemoteImage } from "@/lib/images/remoteImage";

function srcNeedsUnoptimized(src: ImageProps["src"]): boolean {
  return typeof src === "string" && shouldUnoptimizeRemoteImage(src);
}

/**
 * Drop-in replacement for `next/image` that sets `unoptimized` when the default
 * optimizer would proxy the URL (remote http(s), LAN, etc.), avoiding 400/500 from
 * `/_next/image`. Local `/public` paths and `data:` URLs still use optimization.
 */
export default function SafeImage(props: ImageProps) {
  const { src, unoptimized, ...rest } = props;
  return (
    <NextImage
      src={src}
      {...rest}
      unoptimized={Boolean(unoptimized) || srcNeedsUnoptimized(src)}
    />
  );
}
