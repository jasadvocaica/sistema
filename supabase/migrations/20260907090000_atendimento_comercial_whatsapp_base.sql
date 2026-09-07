-- Base omnichannel do Atendimento & Comercial. Nenhum provedor é ativado nesta migração.
CREATE TABLE IF NOT EXISTS public.crm_canais (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL UNIQUE,
 tipo text NOT NULL CHECK (tipo IN ('whatsapp','email','telefone','interno')),
 provedor text, ativo boolean NOT NULL DEFAULT false,
 configuracao_publica jsonb NOT NULL DEFAULT '{}'::jsonb,
 criado_em timestamptz NOT NULL DEFAULT now(), atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.crm_conversas (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 canal_id uuid NOT NULL REFERENCES public.crm_canais(id) ON DELETE RESTRICT,
 lead_id uuid REFERENCES public.mkt_leads(id) ON DELETE SET NULL,
 cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
 atendimento_id uuid REFERENCES public.cliente_atendimentos(id) ON DELETE SET NULL,
 identificador_externo text, responsavel_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','aguardando_cliente','aguardando_escritorio','encerrada')),
 ultima_mensagem_em timestamptz, criado_em timestamptz NOT NULL DEFAULT now(),
 atualizado_em timestamptz NOT NULL DEFAULT now(), UNIQUE(canal_id,identificador_externo)
);
CREATE TABLE IF NOT EXISTS public.crm_mensagens (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 conversa_id uuid NOT NULL REFERENCES public.crm_conversas(id) ON DELETE CASCADE,
 id_externo text, direcao text NOT NULL CHECK (direcao IN ('entrada','saida','interna')),
 tipo text NOT NULL DEFAULT 'texto' CHECK (tipo IN ('texto','audio','imagem','documento','sistema')),
 conteudo text, arquivo_url text,
 status text NOT NULL DEFAULT 'recebida' CHECK (status IN ('recebida','pendente','enviada','entregue','lida','falhou')),
 enviado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 ocorrido_em timestamptz NOT NULL DEFAULT now(), criado_em timestamptz NOT NULL DEFAULT now(),
 UNIQUE(conversa_id,id_externo)
);
CREATE INDEX IF NOT EXISTS crm_conversas_lead_idx ON public.crm_conversas(lead_id);
CREATE INDEX IF NOT EXISTS crm_conversas_cliente_idx ON public.crm_conversas(cliente_id);
CREATE INDEX IF NOT EXISTS crm_mensagens_conversa_data_idx ON public.crm_mensagens(conversa_id,ocorrido_em DESC);
INSERT INTO public.crm_canais(nome,tipo,provedor,ativo) VALUES('WhatsApp','whatsapp',NULL,false) ON CONFLICT(nome) DO NOTHING;
ALTER TABLE public.crm_canais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_mensagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_canais_select ON public.crm_canais FOR SELECT TO authenticated USING(public.has_permission(auth.uid(),'marketing'::public.modulo,'visualizar'::public.acao_permissao));
CREATE POLICY crm_canais_manage ON public.crm_canais FOR ALL TO authenticated USING(public.is_gestor(auth.uid())) WITH CHECK(public.is_gestor(auth.uid()));
CREATE POLICY crm_conversas_select ON public.crm_conversas FOR SELECT TO authenticated USING(responsavel_id=auth.uid() OR public.is_gestor(auth.uid()) OR public.has_permission(auth.uid(),'marketing'::public.modulo,'visualizar'::public.acao_permissao));
CREATE POLICY crm_conversas_write ON public.crm_conversas FOR ALL TO authenticated USING(responsavel_id=auth.uid() OR public.is_gestor(auth.uid())) WITH CHECK(responsavel_id=auth.uid() OR public.is_gestor(auth.uid()));
CREATE POLICY crm_mensagens_select ON public.crm_mensagens FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.crm_conversas c WHERE c.id=conversa_id AND (c.responsavel_id=auth.uid() OR public.is_gestor(auth.uid()) OR public.has_permission(auth.uid(),'marketing'::public.modulo,'visualizar'::public.acao_permissao))));
CREATE POLICY crm_mensagens_insert ON public.crm_mensagens FOR INSERT TO authenticated WITH CHECK(direcao='interna' AND enviado_por=auth.uid() AND EXISTS(SELECT 1 FROM public.crm_conversas c WHERE c.id=conversa_id AND (c.responsavel_id=auth.uid() OR public.is_gestor(auth.uid()))));
DROP TRIGGER IF EXISTS crm_canais_updated_at ON public.crm_canais;
CREATE TRIGGER crm_canais_updated_at BEFORE UPDATE ON public.crm_canais FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS crm_conversas_updated_at ON public.crm_conversas;
CREATE TRIGGER crm_conversas_updated_at BEFORE UPDATE ON public.crm_conversas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
COMMENT ON TABLE public.crm_canais IS 'Configuração sem segredos; credenciais ficam nos secrets do backend.';
COMMENT ON TABLE public.crm_mensagens IS 'Mensagens reais e idempotentes por conversa/provedor.';
