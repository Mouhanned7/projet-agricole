/**
 * Traduction français → arabe. Les textes sources restent écrits en français
 * dans le code ; ce module les traduit à l'affichage.
 * 1. correspondance exacte dans ar.json ;
 * 2. modèles pour les phrases avec des valeurs (« 4 terrains ») ;
 * 3. textes composés (« Titre déclaré, eau déclarée, aucun document »).
 * Un texte inconnu (nom de terrain, saisie d'un utilisateur) reste inchangé.
 */
import dictionary from "./ar.json";

const DICT = dictionary as Record<string, string>;

export const normalize = (s: string) => s.replace(/’/g, "'").replace(/\s+/g, " ").trim();

const LOWER = new Map(Object.entries(DICT).map(([k, v]) => [k.toLowerCase(), v]));

type Pattern = [RegExp, (t: (s: string) => string, ...g: string[]) => string];

const PATTERNS: Pattern[] = [
  [/^(\d+) terrains?$/, (_, n) => `${n} أرض`],
  [/^(\d+) sans titre ni eau masqués?$/, (_, n) => `${n} بدون رسم ولا ماء (مخفية)`],
  [/^(\d+) terrains? sans titre ni eau masqués? par défaut\.$/, (_, n) => `${n} أرض بدون رسم ولا ماء مخفية افتراضيًا.`],
  [/^(\d+) terrains?, triés par .*$/, (_, n) => `${n} أرض مرتبة حسب «الموصى بها».`],
  [/^(\d+) terrains? si vous retirez le filtre « (.+) »$/, (t, n, f) => `${n} أرض إذا أزلت المرشح «${t(f)}»`],
  [/^Voir (\d+) résultats?$/, (_, n) => `عرض ${n} نتيجة`],
  [/^(\d+) documents?$/, (_, n) => `${n} وثيقة`],
  [/^(\d+) photos?, (\d+) documents?$/, (_, a, b) => `${a} صورة، ${b} وثيقة`],
  [/^(\d+) pièces? \(consultables par VerdOlive\)$/, (_, n) => `${n} وثيقة (يطلع عليها فريق VerdOlive)`],
  [/^Pièces justificatives \((\d+)\)$/, (_, n) => `الوثائق المؤيدة (${n})`],
  [/^Alertes \((\d+)\)$/, (_, n) => `التنبيهات (${n})`],
  [/^(\d+) signalement\(s\) à traiter$/, (_, n) => `${n} تبليغ للمعالجة`],
  [/^(\d+) terrain\(s\)\. .*$/, (_, n) => `${n} أرض. لا تظهر المسودات ما لم يتم إرسالها.`],
  [/^(\d+) terrains? · positions approximatives(?: · (\d+) sans position)?$/, (_, n, m) => `${n} أرض · مواقع تقريبية${m ? ` · ${m} بدون موقع` : ""}`],
  [/^Étape (\d+) sur 7$/, (_, n) => `المرحلة ${n} من 7`],
  [/^Étape (\d+) : (.+)$/, (t, n, s) => `المرحلة ${n}: ${t(s)}`],
  [/^Reprendre à l'étape (\d+)$/, (_, n) => `مواصلة من المرحلة ${n}`],
  [/^Complété à (\d+) %$/, (_, n) => `مكتمل بنسبة ${n}%`],
  [/^Dossier complété à (\d+) %$/, (_, n) => `اكتمل الملف بنسبة ${n}%`],
  [/^(\d+) % complet$/, (_, n) => `${n}% مكتمل`],
  [/^Complétude : (\d+) %$/, (_, n) => `نسبة الاكتمال: ${n}%`],
  [/^(\d+(?:[.,]\d+)?) % propriétaire$/, (_, n) => `${n}% للمالك`],
  [/^Propriétaire : (.+)$/, (t, v) => `المالك: ${t(v)}`],
  [/^Investisseur : (.+)$/, (t, v) => `المستثمر: ${t(v)}`],
  [/^(\d[\d ]*(?:[.,]\d+)?) ha$/, (_, n) => `${n} هك`],
  [/^(\d[\d ]*) TND(?: \((annuel|mensuel|autre)\))?$/, (t, n, p) => `${n} د.ت${p ? ` (${t(p)})` : ""}`],
  [/^(\d+(?:[.,]\d+)?) ans$/, (_, n) => `${n} سنوات`],
  [/^(\d+) arbres$/, (_, n) => `${n} شجرة`],
  [/^Soumis le (.+)$/, (_, d) => `أُرسل في ${d}`],
  [/^Envoyée le (.+)$/, (_, d) => `أُرسل في ${d}`],
  [/^Reçue le (.+)$/, (_, d) => `ورد في ${d}`],
  [/^Calculé le (.+)$/, (_, d) => `حُسب في ${d}`],
  [/^déposé le (.+)$/, (_, d) => `أودعت في ${d}`],
  [/^vérifié le (.+)$/, (_, d) => `تم التحقق في ${d}`],
  [/^Vérifié par VerdOlive(?: le (.+))?$/, (_, d) => `تحقق منه فريق VerdOlive${d ? ` في ${d}` : ""}`],
  [/^Relu et validé par VerdOlive(?: le (.+))?$/, (_, d) => `راجعه وصادق عليه فريق VerdOlive${d ? ` في ${d}` : ""}`],
  [/^Retirer le filtre (.+)$/, (t, f) => `إزالة المرشح ${t(f)}`],
  [/^Photo du terrain (.+)$/, (_, n) => `صورة الأرض ${n}`],
  [/^Photo (\d+)$/, (_, n) => `صورة ${n}`],
  [/^Notifications(?: \((\d+) non lues\))?$/, (_, n) => `الإشعارات${n ? ` (${n} غير مقروءة)` : ""}`],
  [/^Bonjour (.+)$/, (_, n) => `مرحبًا ${n}`],
  [/^Statut : (.+?)\.?$/, (t, s) => `الحالة: ${t(s)}`],
  [/^Classement : (.+)$/, (t, s) => `سبب الترتيب: ${t(s)}`],
  [/^Statut de classement : (.+)$/, (t, s) => `حالة الترتيب: ${t(s)}`],
  [/^À compléter : (.+)$/, (t, s) => `غير مكتمل: ${t(s.charAt(0).toUpperCase() + s.slice(1) + ".")}`],
  [/^(.+) \(informations essentielles à compléter\)$/, (t, s) => `${t(s)} (معلومات أساسية في انتظار الإكمال)`],
  [/^Lien envoyé à (.+?)\. Pensez .*$/, (_, e) => `أُرسل الرابط إلى ${e}. تحقق من البريد غير المرغوب فيه.`],
  [/^Si un compte existe pour (.+?), un lien de connexion .*$/, (_, e) => `إن وُجد حساب لـ ${e} فقد أُرسل إليه رابط دخول.`],
  [/^Si un compte existe pour (.+?), un lien de réinitialisation .*$/, (_, e) => `إن وُجد حساب لـ ${e} فقد أُرسل إليه رابط إعادة التعيين.`],
  [/^Confirmez votre adresse$/, () => "أكّد بريدك"],
  // Diagnostic agricole
  [/^Climat (aride|semi-aride|subhumide) \((\d+) mm de pluie, ([\d.]+) °C de moyenne\)\. Culture la plus adaptée : (.+) \((.+), (\d+)\/100\)\.$/,
    (t, c, mm, tc, crop, lvl, n) => `مناخ ${t(c)} (${mm} مم من الأمطار، معدل ${tc} °م). الزراعة الأكثر ملاءمة: ${t(crop)} (${t(lvl)}، ${n}/100).`],
  [/^Cultures les plus adaptées : (.+)\.$/, (t, l) => `الزراعات الأكثر ملاءمة: ${l.split(", ").map(t).join("، ")}.`],
  [/^Pluie suffisante en culture sèche \((.+) mm\/an\)\.$/, (_, n) => `الأمطار كافية للزراعة البعلية (${n} مم/سنة).`],
  [/^Pluie insuffisante \((.+) mm\/an, (.+) mm requis\) et pas d'eau sur le terrain\.$/, (_, a, b) => `أمطار غير كافية (${a} مم/سنة، المطلوب ${b} مم) ولا ماء في الأرض.`],
  [/^Eau trop salée \((.+) g\/l ; tolérance (.+) g\/l\)\.$/, (_, a, b) => `ماء شديد الملوحة (${a} غ/ل، والحد ${b} غ/ل).`],
  [/^Salinité de l'eau au-dessus de la tolérance \((.+) g\/l\)\.$/, (_, a) => `ملوحة الماء فوق الحد المقبول (${a} غ/ل).`],
  [/^Gel fréquent \((.+) jours par an\)\.$/, (_, a) => `جليد متكرر (${a} يومًا في السنة).`],
  [/^Hiver trop doux pour les besoins en froid \((.+) jours froids\)\.$/, (_, a) => `شتاء دافئ لا يلبي الحاجة إلى البرد (${a} يوم بارد).`],
  [/^Été pas assez chaud pour la maturation \((.+) °C au mois le plus chaud\)\.$/, (_, a) => `صيف غير حار كفاية للنضج (${a} °م في أحرّ شهر).`],
  [/^Chaleur estivale excessive \((.+) °C au mois le plus chaud\)\.$/, (_, a) => `حرارة صيفية مفرطة (${a} °م في أحرّ شهر).`],
  [/^Débit déclaré suffisant pour environ (.+) ha seulement\.$/, (_, a) => `التدفق المصرح به يكفي لحوالي ${a} هك فقط.`],
  [/^Débit suffisant pour irriguer environ (.+) ha\.$/, (_, a) => `التدفق يكفي لري حوالي ${a} هك.`],
  [/^pH du sol hors plage \((.+)\)\.$/, (_, a) => `حموضة التربة خارج المجال (${a}).`],
  [/^pH du sol favorable \((.+)\)\.$/, (_, a) => `حموضة التربة مناسبة (${a}).`],
  [/^Le débit couvre environ (\d+) % du besoin .*$/, (_, n) => `التدفق يغطي حوالي ${n}% من الحاجة: قلّص المساحة المروية أو اختر زراعة أقل استهلاكًا أو أنجز حوض تخزين.`],
  [/^Besoin estimé : (.+) m³\/an(?: · disponible : (.+) m³\/an)?$/, (_, a, b) => `الحاجة المقدرة: ${a} م³/سنة${b ? ` · المتوفر: ${b} م³/سنة` : ""}`],
];

/** Renvoie la traduction, ou null si le texte est inconnu. */
export function lookup(input: string, depth = 0): string | null {
  const s = normalize(input);
  if (!s || !/[A-Za-zÀ-ÿ]/.test(s)) return null;
  const exact = DICT[s] ?? LOWER.get(s.toLowerCase());
  if (exact) return exact;
  if (depth > 3) return null;
  const t = (x: string) => lookup(x, depth + 1) ?? x;
  for (const [re, fn] of PATTERNS) {
    const m = s.match(re);
    if (m) return fn(t, ...m.slice(1));
  }
  // Listes « a · b » : chaque partie connue est traduite, les noms restent tels quels.
  if (s.includes("·")) {
    const parts = s.split(/\s*·\s*/);
    const done = parts.map((p) => (p ? lookup(p, depth + 1) : ""));
    if (done.some(Boolean)) return parts.map((p, i) => done[i] || p).join(" · ").trim();
  }
  // Listes à virgules ou « ou » : seulement si toutes les parties sont connues.
  for (const [sep, joiner] of [[", ", "، "], [" ou ", " أو "]] as const) {
    if (!s.includes(sep)) continue;
    const parts = s.split(sep).map((p) => lookup(p, depth + 1));
    if (parts.every(Boolean)) return parts.join(joiner);
  }
  // Plusieurs phrases à la suite.
  const sentences = s.match(/[^.!?]+[.!?](?=\s|$)/g);
  if (sentences && sentences.length > 1 && sentences.join("").length >= s.length - sentences.length) {
    const parts = sentences.map((p) => lookup(p.trim(), depth + 1));
    if (parts.every(Boolean)) return parts.join(" ");
  }
  return null;
}

/** Les mêmes textes reviennent à chaque changement de page : résultats mémorisés. */
const cache = new Map<string, string | null>();

/** Traduit en conservant les espaces autour du texte. */
export function translate(raw: string): string {
  let out = cache.get(raw);
  if (out === undefined) {
    out = lookup(raw);
    if (cache.size > 5000) cache.clear();
    cache.set(raw, out);
  }
  if (out == null) return raw;
  const lead = raw.match(/^\s*/)![0];
  const trail = raw.match(/\s*$/)![0];
  return lead + out + trail;
}
