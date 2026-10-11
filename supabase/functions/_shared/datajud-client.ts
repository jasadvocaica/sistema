export const BASE_URL = "https://api-publica.datajud.cnj.jus.br";

// Chave pública vigente publicada pelo próprio CNJ. A variável de ambiente
// continua tendo prioridade, permitindo rotação sem novo deploy.
export const DATAJUD_PUBLIC_API_KEY =
  "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";

// Aliases por tribunal (replica src/lib/datajud.ts)
export const TRIBUNAL_ALIAS: Record<string, string> = {
  TST: "api_publica_tst", TSE: "api_publica_tse", STJ: "api_publica_stj", STM: "api_publica_stm",
  TRF1: "api_publica_trf1", TRF2: "api_publica_trf2", TRF3: "api_publica_trf3",
  TRF4: "api_publica_trf4", TRF5: "api_publica_trf5", TRF6: "api_publica_trf6",
  TJAC: "api_publica_tjac", TJAL: "api_publica_tjal", TJAM: "api_publica_tjam", TJAP: "api_publica_tjap",
  TJBA: "api_publica_tjba", TJCE: "api_publica_tjce", TJDFT: "api_publica_tjdft", TJES: "api_publica_tjes",
  TJGO: "api_publica_tjgo", TJMA: "api_publica_tjma", TJMG: "api_publica_tjmg", TJMS: "api_publica_tjms",
  TJMT: "api_publica_tjmt", TJPA: "api_publica_tjpa", TJPB: "api_publica_tjpb", TJPE: "api_publica_tjpe",
  TJPI: "api_publica_tjpi", TJPR: "api_publica_tjpr", TJRJ: "api_publica_tjrj", TJRN: "api_publica_tjrn",
  TJRO: "api_publica_tjro", TJRR: "api_publica_tjrr", TJRS: "api_publica_tjrs", TJSC: "api_publica_tjsc",
  TJSE: "api_publica_tjse", TJSP: "api_publica_tjsp", TJTO: "api_publica_tjto",
  TRT1: "api_publica_trt1", TRT2: "api_publica_trt2", TRT3: "api_publica_trt3", TRT4: "api_publica_trt4",
  TRT5: "api_publica_trt5", TRT6: "api_publica_trt6", TRT7: "api_publica_trt7", TRT8: "api_publica_trt8",
  TRT9: "api_publica_trt9", TRT10: "api_publica_trt10", TRT11: "api_publica_trt11", TRT12: "api_publica_trt12",
  TRT13: "api_publica_trt13", TRT14: "api_publica_trt14", TRT15: "api_publica_trt15", TRT16: "api_publica_trt16",
  TRT17: "api_publica_trt17", TRT18: "api_publica_trt18", TRT19: "api_publica_trt19", TRT20: "api_publica_trt20",
  TRT21: "api_publica_trt21", TRT22: "api_publica_trt22", TRT23: "api_publica_trt23", TRT24: "api_publica_trt24",
};

export interface DataJudMovimento {
  codigo?: number;
  nome?: string;
  dataHora?: string;
  complemento?: any;
  complementosTabelados?: any[];
}

// Constrói o header Authorization no formato exigido pela API DataJud do CNJ:
// "APIKey <chave>" — exatamente um espaço, sem aspas/caracteres extras.
// Exportado para ser validado em testes automatizados.
export function buildDataJudAuthHeader(apiKey: string): string {
  return `APIKey ${apiKey}`;
}

/**
 * Formata um CNJ de 20 dígitos no padrão NNNNNNN-DD.AAAA.J.TT.OOOO.
 * A consulta aceita o formato numérico oficial e a máscara legada.
 */
export function formatarCNJ(numeroLimpo: string): string {
  const d = numeroLimpo.replace(/\D/g, "");
  if (d.length !== 20) return numeroLimpo;
  return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14, 16)}.${d.slice(16, 20)}`;
}

async function buscarPorNumero(url: string, apiKey: string, numero: string): Promise<any | null> {
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    let response: Response;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 65000);
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { Authorization: buildDataJudAuthHeader(apiKey.trim()), "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          size: 20,
          query: { bool: { should: [
            { match: { numeroProcesso: numero } },
            { match: { numeroProcesso: formatarCNJ(numero) } },
          ], minimum_should_match: 1 } },
        }),
      });
    } catch (erro) {
      if (tentativa === 1) throw new Error("DataJud indisponível ou excedeu o tempo limite de consulta");
      await new Promise(r => setTimeout(r, 1000 * 2 ** tentativa));
      continue;
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) {
      const mensagem = (await response.text()).slice(0, 200);
      if ([429, 502, 503, 504].includes(response.status) && tentativa < 1) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        const espera = Math.min(5000, Math.max(1000 * 2 ** tentativa, Number.isFinite(retryAfter) ? retryAfter * 1000 : 0));
        await new Promise(r => setTimeout(r, espera));
        continue;
      }
      throw new Error(`DataJud ${response.status}: ${mensagem}`);
    }
    const data = await response.json();
    if (data.timed_out || data._shards?.failed > 0) {
      throw new Error("DataJud retornou uma consulta incompleta; tente novamente mais tarde");
    }
    // O mesmo CNJ pode ter documentos por grau. Combina seus movimentos.
    const fontes = (data?.hits?.hits ?? []).map((h: any) => h._source)
      .filter((f: any) => String(f?.numeroProcesso ?? "").replace(/\D/g, "") === numero.replace(/\D/g, ""));
    if (fontes.length === 0) return null;
    fontes.sort((a: any, b: any) => String(b.dataHoraUltimaAtualizacao ?? "").localeCompare(String(a.dataHoraUltimaAtualizacao ?? "")));
    const movimentos = new Map<string, any>();
    for (const f of fontes) for (const m of f.movimentos ?? []) {
      movimentos.set(`${m.codigo ?? "0"}_${m.dataHora}`, m);
    }
    return { ...fontes[0], movimentos: [...movimentos.values()] };
  }
  return null;
}

export async function consultarProcesso(
  numeroCNJLimpo: string,
  tribunalSigla: string,
  apiKey: string,
): Promise<any | null> {
  const alias = TRIBUNAL_ALIAS[tribunalSigla];
  if (!alias) throw new Error(`Tribunal ${tribunalSigla} não suportado pelo DataJud`);

  const url = `${BASE_URL}/${alias}/_search`;
  const numeroLimpo = numeroCNJLimpo.replace(/\D/g, "");
  if (numeroLimpo.length !== 20) throw new Error("Número CNJ deve ter 20 dígitos");

  // Consulta ambas as formas em uma requisição, sem dobrar o tempo de espera.
  return await buscarPorNumero(url, apiKey, numeroLimpo);
}
