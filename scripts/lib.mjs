// Fonctions pures : lecture des flux RSS/Atom, nettoyage du texte, classement par thème.
// Aucune dépendance, pour tourner tel quel sur GitHub Actions (Node 20+).

export const THEMES = {
  animaux: ["animal","animals","wildlife","species","bird","birds","whale","whales","dolphin","elephant","elephants","tiger","tigers","lion","lions","wolf","wolves","bear","bears","bee","bees","butterfly","butterflies","dog","dogs","cat","cats","puppy","kitten","horse","owl","eagle","gorilla","panda","rhino","koala","otter","beaver","bison","conservation","endangered","poaching",
            "animal","animaux","faune","oiseau","oiseaux","espèce","espèces","chien","chiens","chat","chats","baleine","éléphant","tigre","loup","ours","abeille","abeilles","papillon","cheval","refuge"],
  ocean:   ["ocean","oceans","sea","seas","marine","coral","reef","reefs","fish","shark","sharks","seagrass","turtle","turtles","seal","seals","kelp","coastline","beach",
            "océan","océans","mer","mers","marin","marine","corail","coraux","récif","poisson","poissons","requin","tortue","tortues","phoque","plage","littoral"],
  nature:  ["forest","forests","tree","trees","nature","rewilding","rewild","river","rivers","park","national park","protected area","biome","biomes","rainforest","amazon","mountain","lake","biodiversity","plant","plants","garden","soil","wetland","wetlands","climate","glacier","pollution","recycling","plastic","farm","farmers",
            "forêt","forêts","arbre","arbres","rivière","fleuve","biodiversité","jardin","plante","plantes","climat","sol","zone humide","pollution","recyclage","plastique","agriculteur","agriculture","écologie"],
  ia:      ["ai","artificial intelligence","robot","robots","algorithm","machine learning","technology","invention","innovation","scientists","researchers","discovery","discovered","study","space","nasa","telescope","quantum","physics","chemistry","meteor","moon","planet","astronomers","archaeologists","fossil",
            "ia","intelligence artificielle","robot","algorithme","technologie","invention","innovation","chercheurs","scientifiques","découverte","espace","télescope","quantique"],
  sante:   ["health","cancer","disease","diseases","vaccine","vaccines","patients","patient","medical","medicine","therapy","treatment","hospital","doctor","doctors","nurse","mental health","brain","alzheimer","diabetes","hiv","malaria","surgery","drug",
            "santé","cancer","maladie","maladies","vaccin","vaccins","médical","médecine","thérapie","traitement","hôpital","médecin","infirmière","cerveau","alzheimer","diabète","paludisme","chirurgie"],
  energie: ["solar","wind","energy","renewable","renewables","battery","batteries","electric","ev","coal","emissions","carbon","clean energy","heat pump","geothermal","hydrogen","fusion",
            "solaire","éolien","éolienne","énergie","renouvelable","renouvelables","batterie","électrique","charbon","émissions","carbone","pompe à chaleur","géothermie","hydrogène"]
};

// Titres à écarter : le fil doit rester positif.
export const BLOCK = ["killed","kills","dies","died","death","dead","war","shooting","murder","attack","crash","tragedy","funeral",
  "mort","morts","meurt","décès","guerre","tué","tués","meurtre","attentat","drame","tragédie","obsèques"];

const ENT = { amp:"&", lt:"<", gt:">", quot:'"', apos:"'", nbsp:" ", hellip:"…", rsquo:"’", lsquo:"‘", rdquo:"”", ldquo:"“", ndash:"–", mdash:"—", eacute:"é", egrave:"è", agrave:"à", ccedil:"ç" };
export function decode(s=""){
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi,(m,e)=>{
    if(e[0]==="#") { const n = e[1]==="x"||e[1]==="X" ? parseInt(e.slice(2),16) : parseInt(e.slice(1),10); return isNaN(n)?m:String.fromCodePoint(n); }
    return ENT[e.toLowerCase()] ?? m;
  });
}
const uncdata = s => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1");
export function stripHtml(s=""){
  return decode(s
    .replace(/<p>(?:(?!<\/?p>)[\s\S])*?appeared first on(?:(?!<\/?p>)[\s\S])*?<\/p>/gi," ")
    .replace(/<(script|style|figure|figcaption)[\s\S]*?<\/\1>/gi," ")
    .replace(/<[^>]+>/g," "))
    .replace(/\[(…|&#8230;|\.\.\.)\]/g,"")
    .replace(/The post .* appeared first on .*$/i,"")
    .replace(/\s+/g," ").trim()
    .replace(/^by [^.]{0,60}?(team|staff|editors?)\b\s*/i,"");
}
export function truncate(s, n=240){
  if(s.length<=n) return s;
  const cut = s.slice(0,n); const i = cut.lastIndexOf(" ");
  return cut.slice(0, i>n*0.6?i:n).replace(/[,;:.\s]+$/,"") + "…";
}

function tag(block, name){
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`,"i"));
  return m ? uncdata(m[1]).trim() : "";
}
function tags(block, name){
  return [...block.matchAll(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`,"gi"))].map(m=>stripHtml(uncdata(m[1])));
}
function attr(block, re){ const m = block.match(re); return m ? decode(m[1]) : ""; }

function findImage(block){
  return attr(block,/<media:content[^>]*url="([^"]+)"[^>]*(?:medium="image"|type="image)/i)
      || attr(block,/<media:content[^>]*(?:medium="image"|type="image[^"]*")[^>]*url="([^"]+)"/i)
      || attr(block,/<media:thumbnail[^>]*url="([^"]+)"/i)
      || attr(block,/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i)
      || attr(block,/<enclosure[^>]*type="image[^"]*"[^>]*url="([^"]+)"/i)
      || attr(uncdata(block),/<img[^>]*\ssrc="(https?:[^"]+)"/i)
      || "";
}

/** Transforme le texte d'un flux RSS ou Atom en liste d'articles bruts. */
export function parseFeed(xml, feed){
  const blocks = [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].map(m=>m[0]);
  const atom = blocks.length ? [] : [...xml.matchAll(/<entry[\s>][\s\S]*?<\/entry>/gi)].map(m=>m[0]);
  return [...blocks, ...atom].map(b=>{
    const title = stripHtml(tag(b,"title"));
    let link = stripHtml(tag(b,"link")) || attr(b,/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/i) || attr(b,/<link[^>]*href="([^"]+)"/i);
    const date = tag(b,"pubDate") || tag(b,"published") || tag(b,"updated") || tag(b,"dc:date");
    const desc = stripHtml(tag(b,"description") || tag(b,"summary")) || stripHtml(tag(b,"content:encoded") || tag(b,"content"));
    const categories = [...tags(b,"category"), ...[...b.matchAll(/<category[^>]*term="([^"]+)"/gi)].map(m=>decode(m[1]))];
    const t = Date.parse(date);
    return {
      title, url: link.trim(), summary: truncate(desc),
      date: isNaN(t) ? null : new Date(t).toISOString(),
      image: findImage(b), categories,
      source: feed.name, lang: feed.lang
    };
  }).filter(i=>i.title && /^https?:\/\//.test(i.url));
}

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
const wordRe = new Map();
function hits(text, word){
  if(!wordRe.has(word)) wordRe.set(word, new RegExp(`(^|[^\\p{L}\\p{N}])${esc(word)}($|[^\\p{L}\\p{N}])`,"giu"));
  const re = wordRe.get(word); re.lastIndex = 0;
  return (text.match(re)||[]).length;
}

/** Choisit le thème d'un article : le titre compte triple, les catégories double, le résumé simple. */
export function classify(item){
  const title = item.title.toLowerCase(), cats = item.categories.join(" ").toLowerCase(), sum = item.summary.toLowerCase();
  let best = "societe", score = 0;
  for(const [theme, words] of Object.entries(THEMES)){
    let s = 0;
    for(const w of words){ s += 3*hits(title,w) + 2*hits(cats,w) + hits(sum,w); }
    if(s > score){ score = s; best = theme; }
  }
  return best;
}

export function isBlocked(item, feed){
  const t = item.title.toLowerCase();
  if(BLOCK.some(w=>hits(t,w))) return true;
  const skip = (feed.skipCategories||[]).map(s=>s.toLowerCase());
  return item.categories.some(c=>skip.includes(c.toLowerCase()));
}

export function idFor(url){
  let h = 2166136261;
  for(const ch of url) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return "n" + (h>>>0).toString(36);
}

const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim();

/**
 * Fusionne les nouveaux articles avec ceux de la veille, enlève les doublons et garde un fil varié.
 * maxPerSource évite qu'une seule source remplisse tout le fil.
 */
export function buildFeed(fresh, previous=[], {now=Date.now(), maxAgeDays=10, maxPerSource=15, max=80}={}){
  const seen = new Set(), seenTitle = new Set(), out = [];
  const all = [...fresh, ...previous]
    .filter(i=>i.date && now - Date.parse(i.date) < maxAgeDays*864e5 && Date.parse(i.date) <= now + 36e5)
    .sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
  const per = {};
  // Un article de la veille déjà traduit garde sa traduction : on le préfère à la version fraîche du flux.
  const prevById = new Map(previous.map(p=>[p.id,p]));
  for(const raw of all){
    const id = raw.id || idFor(raw.url);
    const i = prevById.get(id) || raw, nt = norm(i.original?.title || i.title);
    if(seen.has(id) || seenTitle.has(nt)) continue;
    if((per[i.source]=(per[i.source]||0)+1) > maxPerSource) continue;
    seen.add(id); seenTitle.add(nt);
    const { categories, ...rest } = i;
    out.push({ ...rest, id, cat: i.cat || classify(i) });
    if(out.length>=max) break;
  }
  return out;
}

/** Cherche l'image de partage (og:image) dans le code d'une page d'article. */
export function ogImage(html){
  return decode(
    (html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/i)||[])[1] ||
    (html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i)||[])[1] ||
    (html.match(/<meta[^>]+name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)||[])[1] || "");
}
