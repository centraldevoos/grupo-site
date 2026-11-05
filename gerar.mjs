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
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const SENDFLOW = "https://sndflw.com/i/centraldevoos-gratuito";
const AVISO = "https://centraldevoos-marketing.vercel.app/api/entrar/clique";
const AVISO_VISITA = "https://centraldevoos-marketing.vercel.app/api/entrar/visita";
// Mapa de calor e gravações: projeto do Microsoft Clarity da Central (o mesmo
// das páginas /black-*). O canal vai como etiqueta para filtrar lá.
const CLARITY = "yjvtya7ic9";

/** caminho no site → nome do canal no CDV Marketing (o mesmo do /entrar/<canal>). */
const PAGINAS = [
  { caminho: "grupo", canal: "bio-insta", pasta: "." },
  { caminho: "tiktok", canal: "tiktok" },
  { caminho: "facebook", canal: "facebook" },
  { caminho: "story", canal: "stories-insta" },
  { caminho: "youtube", canal: "youtube" },
  { caminho: "direct", canal: "direct-insta" },
];

const modelo = readFileSync(new URL("./modelo.html", import.meta.url), "utf8");
const comBio = process.argv.includes("--com-bio");

// Três coisas, sem atrasar a página nem o botão:
//  1. o botão leva ao Sendflow (com as UTMs da página) e, no clique, avisa o canal;
//  2. a VISITA é avisada depois de 1,5 s com a página visível — robô que só
//     baixa o HTML não executa isto, e quem fecha na hora não conta;
//  3. o Clarity (mapa de calor) só carrega depois que a página terminou de abrir.
function script(canal) {
  return `<script>
(function(){var C=${JSON.stringify(canal)},A=${JSON.stringify(AVISO)},V=${JSON.stringify(AVISO_VISITA)},D=${JSON.stringify(SENDFLOW)};
var q=new URLSearchParams(location.search),u={};["utm_source","utm_medium","utm_campaign","utm_content","utm_term","fbclid"].forEach(function(n){var v=q.get(n);if(v)u[n]=v.slice(0,200)});
var p=new URLSearchParams(u).toString(),d=p?D+"?"+p:D;
function avisa(url){var b=JSON.stringify({canal:C,utm:u});try{if(!(navigator.sendBeacon&&navigator.sendBeacon(url,new Blob([b],{type:"text/plain"}))))fetch(url,{method:"POST",body:b,keepalive:true,mode:"no-cors"})}catch(e){}}
document.querySelectorAll("a[data-entrar]").forEach(function(a){a.href=d;a.addEventListener("click",function(){avisa(A);try{window.clarity&&clarity("event","clicou_grupo")}catch(e){}})});
var vis=0,tm=null;function conta(){if(vis)return;if(document.visibilityState==="visible"){tm=setTimeout(function(){if(!vis&&document.visibilityState==="visible"){vis=1;avisa(V)}},1500)}else if(tm){clearTimeout(tm);tm=null}}
document.addEventListener("visibilitychange",conta);conta();
window.addEventListener("load",function(){setTimeout(function(){(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script",${JSON.stringify(CLARITY)});clarity("set","canal",C)},0)});
})();
</script>`;
}

for (const p of PAGINAS) {
  if (p.pasta === "." && !comBio) continue;
  const url = `https://centraldevoos.com/${p.caminho}/`;
  let html = modelo
    .replaceAll("{{URL}}", url)
    .replaceAll("{{SENDFLOW}}", SENDFLOW)
    .replace("</body>", `${script(p.canal)}\n</body>`);
  // Fora da /grupo, imagens e logo vêm da /grupo (um arquivo só para todas).
  if (p.pasta !== ".") {
    html = html.replaceAll('"assets/images/', '"/grupo/assets/images/').replaceAll('"logo-cdv.png"', '"/grupo/logo-cdv.png"');
  }
  const pasta = p.pasta ?? p.caminho;
  mkdirSync(new URL(`./${pasta}/`, import.meta.url), { recursive: true });
  writeFileSync(new URL(`./${pasta}/index.html`, import.meta.url), html);
  console.log(`${url} → canal ${p.canal}`);
}
