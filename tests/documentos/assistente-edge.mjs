// Executa o handler real com Auth, banco e provedor simulados; nenhuma chamada externa.
import { readFile } from "node:fs/promises";
import { transform } from "esbuild";
import assert from "node:assert/strict";

const source = (
  await readFile(
    new URL(
      "../../supabase/functions/documentos-assistente/index.ts",
      import.meta.url,
    ),
    "utf8",
  )
).replace(/import\s*\{\s*createClient\s*\}\s*from\s*"[^"]+";/, "");
const { code } = await transform(source, {
  loader: "ts",
  format: "cjs",
  target: "es2022",
});
const ids = {
  user: "00000000-0000-4000-8000-000000000001",
  peca: "10000000-0000-4000-8000-000000000001",
  cliente: "20000000-0000-4000-8000-000000000001",
  processo: "30000000-0000-4000-8000-000000000001",
};
let handler,
  permitido = true,
  sessao = true,
  providerCalls = 0,
  providerStatus = 200,
  providerFinish = "stop",
  enviado;
const authOptions = [];
const client = {
  auth: {
    getUser: async () => ({
      data: { user: sessao ? { id: ids.user } : null },
      error: null,
    }),
  },
  rpc: async () => ({ data: permitido, error: null }),
  from(table) {
    const data =
      table === "doc_pecas"
        ? {
            id: ids.peca,
            cliente_id: ids.cliente,
            processo_id: ids.processo,
            status: "rascunho",
          }
        : table === "clientes"
          ? { id: ids.cliente, nome: "Cliente fictício" }
          : {
              id: ids.processo,
              cliente_id: ids.cliente,
              numero_cnj: "Processo fictício",
            };
    const query = {
      select: () => query,
      eq: () => query,
      maybeSingle: async () => ({ data, error: null }),
    };
    return query;
  },
};
const DenoMock = {
  env: {
    get: (name) =>
      name === "SUPABASE_SERVICE_ROLE_KEY"
        ? assert.fail("Nunca deve usar service_role")
        : name === "SUPABASE_ANON_KEY"
          ? "anon-fixture"
          : "fixture",
  },
  serve: (fn) => {
    handler = fn;
  },
};
const fetchMock = async (url, options) => {
  providerCalls++;
  enviado = JSON.parse(options.body);
  assert.equal(url, "https://ai.gateway.lovable.dev/v1/chat/completions");
  return new Response(
    JSON.stringify({
      choices: [
        {
          finish_reason: providerFinish,
          message: {
            content: JSON.stringify({
              texto: "Sugestão para revisão",
              pendencias: ["Conferir documentos"],
            }),
          },
        },
      ],
    }),
    { status: providerStatus },
  );
};
new Function("createClient", "Deno", "fetch", code)(
  (...args) => {
    authOptions.push(args);
    return client;
  },
  DenoMock,
  fetchMock,
);
const body = {
  peca_id: ids.peca,
  cliente_id: ids.cliente,
  processo_id: ids.processo,
  acao: "minuta",
  instrucao: "Manifestar sobre laudo",
  titulo: "Manifestação",
  conteudo: "Texto atual",
  contexto: {
    documentos: "Trecho do laudo",
    fontes: [],
    ultima_ia: { texto: "NÃO USAR COMO PROVA" },
  },
};
const call = (payload = body, token = true) =>
  handler(
    new Request("http://localhost/documentos-assistente", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer token-fixture" } : {}),
      },
      body: JSON.stringify(payload),
    }),
  );

const health = await handler(
  new Request("http://localhost/documentos-assistente"),
);
assert.equal(health.status, 200);
assert.deepEqual(await health.json(), { status: "ok", ia_configurada: true });

assert.equal((await call(body, false)).status, 401);
sessao = false;
assert.equal((await call()).status, 401);
sessao = true;
permitido = false;
assert.equal((await call()).status, 403);
permitido = true;
assert.equal((await call({ ...body, cliente_id: ids.processo })).status, 409);
assert.equal((await call({ ...body, acao: "protocolar" })).status, 400);
assert.equal(
  providerCalls,
  0,
  "pedidos não autorizados não podem chegar ao provedor",
);
const sucesso = await call();
assert.equal(sucesso.status, 200);
assert.deepEqual(await sucesso.json(), {
  texto: "Sugestão para revisão",
  pendencias: ["Conferir documentos"],
});
assert.ok(
  authOptions.every(
    (args) =>
      args[1] === "anon-fixture" &&
      args[2].global.headers.Authorization === "Bearer token-fixture",
  ),
);
assert.ok(!JSON.stringify(enviado).includes("NÃO USAR COMO PROVA"));
providerStatus = 429;
assert.equal((await call()).status, 429);
providerStatus = 200;
providerFinish = "length";
assert.equal((await call()).status, 502);
console.log(
  "PASS: autenticação, permissão, isolamento do caso, contexto sob RLS, resposta da IA e falhas do provedor.",
);
