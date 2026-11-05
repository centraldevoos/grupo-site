// Worker "grupo-site": serve as páginas de grupo da Cloudflare a partir do
// GitHub Pages deste repositório. Cada caminho do site aponta para uma pasta:
// /grupo é a raiz (link da bio); /tiktok, /facebook, /story, /youtube e
// /direct são as pastas dos canais. Caminho que não existe aqui (ex.: /grupo2,
// a página do tráfego pago) volta para a origem antiga, a Hostinger.
const ORIGEM = "https://centraldevoos.github.io/grupo-site";
const PAGINAS = { "/grupo": "", "/tiktok": "/tiktok", "/facebook": "/facebook", "/story": "/story", "/youtube": "/youtube", "/direct": "/direct" };

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const prefixo = Object.keys(PAGINAS).find((p) => url.pathname === p || url.pathname.startsWith(p + "/"));
    if (!prefixo) return fetch(request);
    if (url.pathname === prefixo) return Response.redirect(url.origin + prefixo + "/" + url.search, 301);
    const caminho = PAGINAS[prefixo] + url.pathname.slice(prefixo.length);
    const resposta = await fetch(ORIGEM + caminho + url.search, {
      headers: { "User-Agent": request.headers.get("User-Agent") || "", Accept: request.headers.get("Accept") || "*/*" },
      cf: { cacheTtl: 60, cacheEverything: true },
    });
    if (resposta.status === 404) return fetch(request);
    const cabecalhos = new Headers(resposta.headers);
    cabecalhos.delete("x-github-request-id");
    return new Response(resposta.body, { status: resposta.status, headers: cabecalhos });
  },
};
