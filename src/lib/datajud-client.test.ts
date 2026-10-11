import { afterEach, describe, expect, it, vi } from "vitest";
import { consultarProcesso } from "../../supabase/functions/_shared/datajud-client";
const cnj = "10017501820268110037";
const hit = (movimentos: unknown[] = [], numeroProcesso = cnj) => ({ _source: { numeroProcesso, movimentos } });
const resposta = (hits: unknown[]) => new Response(JSON.stringify({ hits: { hits } }));
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe("consulta DataJud", () => {
  it("consulta dígitos primeiro e combina graus sem duplicar movimentos", async () => {
    const mov = { codigo: 1, dataHora: "2026-01-01T12:00:00" };
    const fetch = vi.fn().mockResolvedValue(resposta([hit([mov]), hit([mov, { codigo: 2, dataHora: "2026-02-01T12:00:00" }]), hit([], "99999999999999999999")]));
    vi.stubGlobal("fetch", fetch);
    const dados = await consultarProcesso(cnj, "TJMT", " chave ");
    expect(dados.movimentos).toHaveLength(2);
    expect(JSON.parse(fetch.mock.calls[0][1].body).query.match.numeroProcesso).toBe(cnj);
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe("APIKey chave");
  });
  it("usa máscara somente quando não encontrou o CNJ sem pontuação", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(resposta([])).mockResolvedValueOnce(resposta([hit()]));
    vi.stubGlobal("fetch", fetch);
    expect(await consultarProcesso(cnj, "TJMT", "key")).toBeTruthy();
    expect(JSON.parse(fetch.mock.calls[1][1].body).query.match.numeroProcesso).toBe("1001750-18.2026.8.11.0037");
  });
  it.each([429, 502, 503, 504])("recupera de HTTP %s", async status => {
    vi.useFakeTimers();
    const fetch = vi.fn().mockResolvedValueOnce(new Response("sobrecarga", { status })).mockResolvedValueOnce(resposta([hit()]));
    vi.stubGlobal("fetch", fetch);
    const consulta = consultarProcesso(cnj, "TJMT", "key");
    await vi.runAllTimersAsync();
    expect(await consulta).toBeTruthy();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("não repete uma chave recusada", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("invalid key", { status: 401 }));
    vi.stubGlobal("fetch", fetch);
    await expect(consultarProcesso(cnj, "TJMT", "key")).rejects.toThrow("DataJud 401");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("não confunde resposta parcial com processo ausente", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ timed_out: true, hits: { hits: [] } }))));
    await expect(consultarProcesso(cnj, "TJMT", "key")).rejects.toThrow("incompleta");
  });
  it("recupera de timeout de transporte", async () => {
    vi.useFakeTimers();
    const fetch = vi.fn().mockRejectedValueOnce(new Error("timeout")).mockResolvedValueOnce(resposta([hit()]));
    vi.stubGlobal("fetch", fetch);
    const consulta = consultarProcesso(cnj, "TJMT", "key");
    await vi.runAllTimersAsync();
    expect(await consulta).toBeTruthy();
  });
});
