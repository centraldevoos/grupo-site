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

function script(canal) {
  return `<script>
(function(){var C=${JSON.stringify(canal)},A=${JSON.stringify(AVISO)},D=${JSON.stringify(SENDFLOW)};
var q=new URLSearchParams(location.search),u={};["utm_source","utm_medium","utm_campaign","utm_content","utm_term","fbclid"].forEach(function(n){var v=q.get(n);if(v)u[n]=v.slice(0,200)});
var p=new URLSearchParams(u).toString(),d=p?D+"?"+p:D;
document.querySelectorAll("a[data-entrar]").forEach(function(a){a.href=d;a.addEventListener("click",function(){var b=JSON.stringify({canal:C,utm:u});try{if(!(navigator.sendBeacon&&navigator.sendBeacon(A,new Blob([b],{type:"text/plain"}))))fetch(A,{method:"POST",body:b,keepalive:true,mode:"no-cors"})}catch(e){}})})})();
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
