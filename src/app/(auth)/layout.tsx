import Image from "next/image";
import { PHOTOS, photoUrl } from "@/lib/images";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[1fr_minmax(0,560px)]">
      <aside className="relative m-4 hidden overflow-hidden rounded-[2rem] bg-forest-900 lg:block" aria-hidden>
        <Image src={photoUrl("grove")} alt={PHOTOS.grove.alt} fill sizes="50vw" priority quality={85} className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="max-w-md font-serif text-4xl font-semibold leading-tight text-cream-50">
            Des terrains présentés avec leur titre foncier et leur eau.
          </p>
          <p className="mt-3 text-cream-100/75">Vente, location ou partenariat Mgharsa, partout en Tunisie.</p>
        </div>
      </aside>
      <div className="flex items-start justify-center bg-cream-50 px-4 py-10 sm:items-center sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
