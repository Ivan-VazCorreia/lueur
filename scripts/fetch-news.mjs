// Récupère les bonnes nouvelles du jour et écrit news.json.
// Lancé chaque matin par GitHub Actions (.github/workflows/update-news.yml).
// Utilisation locale : node scripts/fetch-news.mjs
import { readFile, writeFile } from "node:fs/promises";
import { parseFeed, isBlocked, buildFeed, ogImage } from "./lib.mjs";

const ROOT = new URL("../", import.meta.url);
const UA = "LueurBot/1.0 (+lecteur de flux RSS de bonnes nouvelles)";

async function get(url, ms = 15000){
  const r = await fetch(url, { headers: { "user-agent": UA, "accept": "application/rss+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5" }, redirect: "follow", signal: AbortSignal.timeout(ms) });
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

const feeds = JSON.parse(await readFile(new URL("feeds.json", ROOT), "utf8"));
let previous = [];
try { previous = JSON.parse(await readFile(new URL("news.json", ROOT), "utf8")).items || []; } catch {}

const fresh = [];
for(const feed of feeds){
  try {
    const items = parseFeed(await get(feed.url), feed).filter(i => !isBlocked(i, feed));
    console.log(`✓ ${feed.name} : ${items.length} articles`);
    fresh.push(...items);
  } catch(e){
    console.warn(`✗ ${feed.name} : ${e.message} (les articles de la veille sont conservés)`);
  }
}

const items = buildFeed(fresh, previous);

// Va chercher l'image de l'article quand le flux n'en donne pas (40 au maximum, en parallèle par 6).
const missing = items.filter(i => !i.image).slice(0, 40);
for(let k = 0; k < missing.length; k += 6){
  await Promise.all(missing.slice(k, k + 6).map(async i => {
    try { i.image = ogImage(await get(i.url, 10000)) || ""; } catch {}
  }));
}

// Traduction en français (facultative) : seulement si la clé DeepL est configurée dans les secrets GitHub.
// Les articles déjà traduits la veille ne sont pas retraduits, pour rester dans le quota gratuit.
const KEY = process.env.DEEPL_KEY;
const toTranslate = items.filter(i => i.lang !== "fr" && !i.original);
if(KEY && toTranslate.length){
  const host = KEY.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";
  try {
    for(let k = 0; k < toTranslate.length; k += 25){
      const batch = toTranslate.slice(k, k + 25);
      const text = batch.flatMap(i => [i.title, i.summary || " "]);
      const r = await fetch(`${host}/v2/translate`, {
        method: "POST",
        headers: { "Authorization": `DeepL-Auth-Key ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text, target_lang: "FR", source_lang: "EN" })
      });
      if(!r.ok) throw new Error(`DeepL HTTP ${r.status}`);
      const t = (await r.json()).translations.map(x => x.text);
      batch.forEach((i, n) => {
        i.original = { title: i.title, summary: i.summary, lang: i.lang };
        i.title = t[2*n];
        i.summary = i.summary ? t[2*n + 1] : "";
      });
    }
    console.log(`Traduit en français : ${toTranslate.length} articles.`);
  } catch(e){ console.warn(`Traduction interrompue (${e.message}) : les articles restants gardent leur langue d'origine.`); }
} else if(!KEY){
  console.log("Pas de clé DeepL : les articles en anglais restent en anglais.");
}

const out = { updated: new Date().toISOString(), count: items.length, items };
await writeFile(new URL("news.json", ROOT), JSON.stringify(out, null, 1) + "\n");
console.log(`news.json : ${items.length} articles, ${items.filter(i => i.image).length} avec image.`);
if(items.length === 0) process.exitCode = 1;
