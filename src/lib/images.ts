/**
 * Photos d'illustration (licence Unsplash : usage libre, commercial compris).
 * Servies depuis images.unsplash.com et optimisées par next/image.
 * Elles illustrent le site ; une carte de terrain sans photo réelle affiche
 * une photo d'illustration signalée comme telle.
 */
export interface StockPhoto {
  id: string;
  alt: string;
  author: string;
  page: string;
}

const u = (id: string) => `https://images.unsplash.com/${id}`;

export const PHOTOS = {
  hero: { id: "photo-1766928538460-582b563fd89e", alt: "Oliveraies au coucher du soleil, collines à l'horizon", author: "Nima Ghazaei", page: "https://unsplash.com/photos/w7M9IvG7HxU" },
  grove: { id: "photo-1785440944109-4021897d9e13", alt: "Oliveraie verdoyante bordée d'un muret de pierre", author: "Lothar Boris Piltz", page: "https://unsplash.com/photos/k_tUO1kGvxc" },
  oldOlive: { id: "photo-1695470393142-4c14422ffb9a", alt: "Vieil olivier au tronc noueux", author: "Thomas Hahnen", page: "https://unsplash.com/photos/kiKCV9P2mSs" },
  oliveRow: { id: "photo-1728940823516-ff387be88638", alt: "Rangée d'oliviers sur une terre rouge", author: "Bastian Cimander", page: "https://unsplash.com/photos/OJ1ZjwAsFbw" },
  hills: { id: "photo-1642687791249-86d868e17746", alt: "Colline couverte d'oliviers", author: "Kostas Morfiris", page: "https://unsplash.com/photos/v8NbNY5OSbY" },
  loneTree: { id: "photo-1698036867785-a8aeb0f59c48", alt: "Olivier isolé sur une terre sèche", author: "Vasilis Caravitis", page: "https://unsplash.com/photos/6gFxye8SVoY" },
  dateGrove: { id: "photo-1786440089783-75297a5256a9", alt: "Palmeraie de dattiers", author: "Craig Manners", page: "https://unsplash.com/photos/_15eeM6p3MY" },
  dates: { id: "photo-1651397802242-10b0902cf928", alt: "Régimes de dattes sur un palmier", author: "ekrem osmanoglu", page: "https://unsplash.com/photos/JG_ulueyzmk" },
  olives: { id: "photo-1758818710855-b60cf3b74de6", alt: "Olives vertes sur une branche", author: "Susana Bartolome", page: "https://unsplash.com/photos/-ZJ9fM0kgZM" },
} satisfies Record<string, StockPhoto>;

export type PhotoKey = keyof typeof PHOTOS;

export function photoUrl(key: PhotoKey) {
  return u(PHOTOS[key].id);
}

const CARD_ROTATION: PhotoKey[] = ["grove", "oliveRow", "oldOlive", "hills", "loneTree"];

/** Photo d'illustration adaptée à la culture du terrain (sans photo réelle). */
export function illustrationFor(text: string, seed: string): PhotoKey {
  if (/palmier|datt|deglet|palmeraie/i.test(text)) return "dateGrove";
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  if (/c[ée]r[ée]al|terre|nue/i.test(text)) return h % 2 ? "loneTree" : "hills";
  return CARD_ROTATION[h % CARD_ROTATION.length];
}
