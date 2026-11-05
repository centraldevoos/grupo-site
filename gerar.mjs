// Gera as páginas de grupo de cada canal a partir de UM modelo (modelo.html,
// a identidade da /grupo). Rodar: `node gerar.mjs` (canais) ou
// `node gerar.mjs --com-bio` (também a /grupo, que é o link da bio).
//
// O botão vai DIRETO para o link do Sendflow — ninguém espera por nós. No
// mesmo clique, o script manda o canal da página para o CDV Marketing
// (sendBeacon), que grava canal, hora e estado do clique e depois liga isso à
// entrada no grupo. Sem JavaScript, o botão funciona igual (só sem canal).
//
// A /grupo2 é a página do TRÁFEGO PAGO e fica no Tintim: não entra aqui.
//
// SPLIT DA ENTRADA (05/11): cada pessoa é sorteada UMA vez (localStorage, a
// mesma chave em todas as páginas): metade vai direto ao Sendflow, metade ao
// link do Tintim do canal ("split <canal>", que conta como o canal no CDV
// Marketing). O braço vai no aviso de visita e de clique. Para encerrar o
// teste: tirar o `tintim` das páginas e gerar de novo.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const SENDFLOW = "https://sndflw.com/i/centraldevoos-gratuito";
const AVISO = "https://centraldevoos-marketing.vercel.app/api/entrar/clique";
const AVISO_VISITA = "https://centraldevoos-marketing.vercel.app/api/entrar/visita";
// Mapa de calor e gravações: projeto do Microsoft Clarity da Central (o mesmo
// das páginas /black-*). O canal vai como etiqueta para filtrar lá.
const CLARITY = "yjvtya7ic9";

/** caminho no site → nome do canal no CDV Marketing (o mesmo do /entrar/<canal>). */
const TINTIM = "https://tintim.link/whatsapp/5e1595d4-a3db-4084-848f-87f553f347ab/";
const PAGINAS = [
  { caminho: "grupo", canal: "bio-insta", pasta: ".", tintim: TINTIM + "f58aa109-d2a8-4f41-9822-37de0a35c04c" }, // split bio insta
  { caminho: "tiktok", canal: "tiktok", tintim: TINTIM + "0ca62bf5-80ca-4ea4-a800-e24cadda216d" }, // split tiktok
  { caminho: "facebook", canal: "facebook", tintim: TINTIM + "d536c0c1-f3f9-4a69-9fc4-1226ba25fb08" }, // split facebook
  { caminho: "story", canal: "stories-insta", tintim: TINTIM + "bb22dabe-bc5b-475d-beaf-8856768a39e5" }, // split stories insta
  { caminho: "youtube", canal: "youtube", tintim: TINTIM + "4f1c48ea-53ea-480c-84c4-06ccfbfc751a" }, // split youtube
  { caminho: "direct", canal: "direct-insta", tintim: TINTIM + "269496a8-6213-4468-887e-9981bfb5fe7d" }, // split direct insta site
];

const modelo = readFileSync(new URL("./modelo.html", import.meta.url), "utf8");
const comBio = process.argv.includes("--com-bio");

// Três coisas, sem atrasar a página nem o botão:
//  1. o botão leva ao Sendflow (com as UTMs da página) e, no clique, avisa o canal;
//  2. a VISITA é avisada depois de 1,5 s com a página visível — robô que só
//     baixa o HTML não executa isto, e quem fecha na hora não conta;
//  3. o Clarity (mapa de calor) só carrega depois que a página terminou de abrir.
function script(canal, tintim) {
  return `<script>
(function(){var C=${JSON.stringify(canal)},A=${JSON.stringify(AVISO)},V=${JSON.stringify(AVISO_VISITA)},D=${JSON.stringify(SENDFLOW)},T=${JSON.stringify(tintim ?? null)},K="cdv_split1",B=null;
if(T){try{B=localStorage.getItem(K)}catch(e){}if(B!=="sendflow"&&B!=="tintim"){B=Math.random()<0.5?"sendflow":"tintim";try{localStorage.setItem(K,B)}catch(e){}}}
var q=new URLSearchParams(location.search),u={};["utm_source","utm_medium","utm_campaign","utm_content","utm_term","fbclid"].forEach(function(n){var v=q.get(n);if(v)u[n]=v.slice(0,200)});
var p=new URLSearchParams(u).toString(),d=B==="tintim"?T:(p?D+"?"+p:D);
function avisa(url){var b=JSON.stringify({canal:C,utm:u,braco:B});try{if(!(navigator.sendBeacon&&navigator.sendBeacon(url,new Blob([b],{type:"text/plain"}))))fetch(url,{method:"POST",body:b,keepalive:true,mode:"no-cors"})}catch(e){}}
document.querySelectorAll("a[data-entrar]").forEach(function(a){a.href=d;a.addEventListener("click",function(){avisa(A);try{window.clarity&&clarity("event","clicou_grupo")}catch(e){}})});
var vis=0,tm=null;function conta(){if(vis)return;if(document.visibilityState==="visible"){tm=setTimeout(function(){if(!vis&&document.visibilityState==="visible"){vis=1;avisa(V)}},1500)}else if(tm){clearTimeout(tm);tm=null}}
document.addEventListener("visibilitychange",conta);conta();
window.addEventListener("load",function(){setTimeout(function(){(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script",${JSON.stringify(CLARITY)});clarity("set","canal",C);if(B)clarity("set","braco",B)},0)});
})();
</script>`;
}

for (const p of PAGINAS) {
  if (p.pasta === "." && !comBio) continue;
  const url = `https://centraldevoos.com/${p.caminho}/`;
  let html = modelo
    .replaceAll("{{URL}}", url)
    .replaceAll("{{SENDFLOW}}", SENDFLOW)
    .replace("</body>", `${script(p.canal, p.tintim)}\n</body>`);
  // Fora da /grupo, imagens e logo vêm da /grupo (um arquivo só para todas).
  if (p.pasta !== ".") {
    html = html.replaceAll('"assets/images/', '"/grupo/assets/images/').replaceAll('"logo-cdv.png"', '"/grupo/logo-cdv.png"');
  }
  const pasta = p.pasta ?? p.caminho;
  mkdirSync(new URL(`./${pasta}/`, import.meta.url), { recursive: true });
  writeFileSync(new URL(`./${pasta}/index.html`, import.meta.url), html);
  console.log(`${url} → canal ${p.canal}`);
}
