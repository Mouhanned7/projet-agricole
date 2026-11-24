/**
 * Référentiel géographique : 24 gouvernorats et leurs principales délégations.
 * Liste des délégations à compléter (≈ 264 au total) avant la mise en production.
 */
export interface Governorate {
  id: string;
  fr: string;
  ar: string;
  delegations: string[];
}

export const GOVERNORATES: Governorate[] = [
  { id: "tunis", fr: "Tunis", ar: "تونس", delegations: ["La Marsa", "Carthage", "Le Bardo", "Sidi Hassine"] },
  { id: "ariana", fr: "Ariana", ar: "أريانة", delegations: ["Ariana Ville", "Kalâat el-Andalous", "Sidi Thabet", "Raoued", "Mnihla"] },
  { id: "ben-arous", fr: "Ben Arous", ar: "بن عروس", delegations: ["Mornag", "Mohamedia", "Fouchana", "Hammam Lif", "Radès"] },
  { id: "manouba", fr: "Manouba", ar: "منوبة", delegations: ["Tebourba", "Mornaguia", "Borj El Amri", "El Battan", "Jedaida"] },
  { id: "nabeul", fr: "Nabeul", ar: "نابل", delegations: ["Nabeul", "Korba", "Menzel Temime", "Kélibia", "Grombalia", "Soliman", "Hammamet", "Béni Khalled", "Bou Argoub", "El Haouaria"] },
  { id: "zaghouan", fr: "Zaghouan", ar: "زغوان", delegations: ["Zaghouan", "El Fahs", "Nadhour", "Bir Mcherga", "Zriba", "Saouaf"] },
  { id: "bizerte", fr: "Bizerte", ar: "بنزرت", delegations: ["Mateur", "Ras Jebel", "Menzel Bourguiba", "Utique", "Ghar El Melh", "Sejnane"] },
  { id: "beja", fr: "Béja", ar: "باجة", delegations: ["Béja Nord", "Béja Sud", "Medjez el-Bab", "Testour", "Téboursouk", "Nefza"] },
  { id: "jendouba", fr: "Jendouba", ar: "جندوبة", delegations: ["Jendouba", "Bou Salem", "Tabarka", "Ain Draham", "Fernana", "Ghardimaou"] },
  { id: "kef", fr: "Le Kef", ar: "الكاف", delegations: ["Le Kef Est", "Le Kef Ouest", "Dahmani", "Tajerouine", "Sers", "Nebeur"] },
  { id: "siliana", fr: "Siliana", ar: "سليانة", delegations: ["Siliana Nord", "Siliana Sud", "Makthar", "Gaâfour", "Bou Arada", "Rouhia"] },
  { id: "sousse", fr: "Sousse", ar: "سوسة", delegations: ["Enfidha", "Msaken", "Kalâa Kebira", "Sidi Bou Ali", "Bouficha", "Kondar"] },
  { id: "monastir", fr: "Monastir", ar: "المنستير", delegations: ["Monastir", "Jemmal", "Moknine", "Ksar Hellal", "Bembla", "Sahline"] },
  { id: "mahdia", fr: "Mahdia", ar: "المهدية", delegations: ["Mahdia", "El Jem", "Chebba", "Ksour Essef", "Souassi", "Chorbane", "Ouled Chamekh"] },
  { id: "sfax", fr: "Sfax", ar: "صفاقس", delegations: ["Sakiet Ezzit", "Agareb", "Jebiniana", "El Hencha", "Menzel Chaker", "Mahrès", "Bir Ali Ben Khalifa", "Skhira", "Graïba"] },
  { id: "kairouan", fr: "Kairouan", ar: "القيروان", delegations: ["Kairouan Nord", "Kairouan Sud", "Haffouz", "Sbikha", "Oueslatia", "Bou Hajla", "Nasrallah", "Chebika"] },
  { id: "kasserine", fr: "Kasserine", ar: "القصرين", delegations: ["Kasserine Nord", "Sbeitla", "Fériana", "Thala", "Foussana", "Sbiba"] },
  { id: "sidi-bouzid", fr: "Sidi Bouzid", ar: "سيدي بوزيد", delegations: ["Sidi Bouzid Ouest", "Regueb", "Meknassy", "Menzel Bouzaiane", "Jilma", "Bir El Hafey", "Mezzouna"] },
  { id: "gabes", fr: "Gabès", ar: "قابس", delegations: ["Gabès Ville", "Mareth", "El Hamma", "Métouia", "Matmata", "Ghannouch"] },
  { id: "medenine", fr: "Médenine", ar: "مدنين", delegations: ["Médenine Nord", "Médenine Sud", "Zarzis", "Ben Gardane", "Djerba Houmt Souk", "Djerba Midoun", "Beni Khedache"] },
  { id: "tataouine", fr: "Tataouine", ar: "تطاوين", delegations: ["Tataouine Nord", "Tataouine Sud", "Ghomrassen", "Bir Lahmar", "Remada"] },
  { id: "gafsa", fr: "Gafsa", ar: "قفصة", delegations: ["Gafsa Nord", "Gafsa Sud", "El Ksar", "Sned", "El Guettar", "Métlaoui"] },
  { id: "tozeur", fr: "Tozeur", ar: "توزر", delegations: ["Tozeur", "Nefta", "Degache", "Tamerza", "Hazoua"] },
  { id: "kebili", fr: "Kébili", ar: "قبلي", delegations: ["Kébili Nord", "Kébili Sud", "Douz Nord", "Douz Sud", "Souk Lahad", "Faouar"] },
];

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function delegationId(govId: string, name: string): string {
  return `${govId}-${slugify(name)}`;
}
