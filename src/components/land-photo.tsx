import Image from "next/image";
import { illustrationFor, PHOTOS, photoUrl } from "@/lib/images";
import { cn } from "@/lib/utils";

/**
 * Photo d'un terrain : la vraie photo si le porteur en a déposé, sinon une
 * photo d'illustration adaptée à la culture, signalée comme telle.
 */
export function LandPhoto({
  src,
  landId,
  crops,
  alt,
  sizes,
  priority,
  className,
  showTag = true,
}: {
  src?: string | null;
  landId: string;
  crops: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  showTag?: boolean;
}) {
  if (src)
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-cover", className)} />;
  const key = illustrationFor(crops, landId);
  return (
    <>
      <Image src={photoUrl(key)} alt={PHOTOS[key].alt} fill sizes={sizes} priority={priority} quality={80} className={cn("object-cover", className)} />
      {showTag && (
        <span className="absolute bottom-3 right-3 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-medium text-ink-600 backdrop-blur">
          Photo d&apos;illustration
        </span>
      )}
    </>
  );
}
