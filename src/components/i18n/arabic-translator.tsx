"use client";

import { useEffect } from "react";
import { translate } from "@/lib/i18n/translate";

const ATTRIBUTES = ["placeholder", "aria-label", "title", "alt"] as const;
const SKIP = "script,style,noscript,[translate=no],.maplibregl-canvas-container";

/** Texte français d'origine et dernière valeur écrite, par nœud. */
const originals = new WeakMap<Text, { source: string; written: string }>();

function sourceOf(node: Text) {
  const known = originals.get(node);
  // Si React a modifié le nœud, la nouvelle valeur devient la source.
  return known && known.written === node.data ? known.source : node.data;
}

function write(node: Text, source: string, value: string) {
  originals.set(node, { source, written: value });
  if (node.data !== value) node.data = value;
}

/**
 * React découpe « {n} terrains » en plusieurs nœuds de texte voisins : on les
 * traduit ensemble, le résultat va dans le premier.
 */
function translateRun(run: Text[]) {
  const sources = run.map(sourceOf);
  const joined = sources.join("");
  const whole = translate(joined);
  if (run.length > 1 && whole !== joined) {
    run.forEach((n, i) => write(n, sources[i], i === 0 ? whole : ""));
    return;
  }
  run.forEach((n, i) => write(n, sources[i], translate(sources[i])));
}

function translateElement(el: Element) {
  if (el.closest(SKIP)) return;
  for (const name of ATTRIBUTES) {
    const v = el.getAttribute(name);
    if (v) {
      const t = translate(v);
      if (t !== v) el.setAttribute(name, t);
    }
  }
  // Le contenu d'une zone de saisie appartient à l'utilisateur : seuls ses attributs sont traduits.
  if (el.tagName === "TEXTAREA") return;
  let run: Text[] = [];
  const flush = () => {
    if (run.length) translateRun(run);
    run = [];
  };
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) run.push(child as Text);
    else if (child.nodeType !== Node.COMMENT_NODE) flush();
  }
  flush();
}

function translateTree(root: Element) {
  translateElement(root);
  root.querySelectorAll("*").forEach(translateElement);
}

/** Affiche le site en arabe : traduit la page puis chaque changement. */
export function ArabicTranslator() {
  useEffect(() => {
    let observer: MutationObserver | null = null;
    const start = () => {
      translateTree(document.body);
      document.title = translate(document.title);
      observer = new MutationObserver((mutations) => {
        const targets = new Set<Element>();
        for (const m of mutations) {
          if (m.type === "childList") {
            if (m.target instanceof Element) targets.add(m.target);
            m.addedNodes.forEach((n) => n instanceof Element && translateTree(n));
          } else if (m.type === "characterData" && m.target.parentElement) targets.add(m.target.parentElement);
          else if (m.type === "attributes" && m.target instanceof Element) targets.add(m.target);
        }
        targets.forEach(translateElement);
      });
      observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRIBUTES] });
      document.documentElement.removeAttribute("data-i18n");
    };
    // Après l'hydratation de React.
    const timer = window.setTimeout(start, 0);
    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, []);
  return null;
}
