import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, MessageSquareText, Search, Users } from "lucide-react";
import { STATUS_LEAD, CANAIS_LEAD } from "@/pages/marketing/types";

type Lead = { id:string; nome:string; whatsapp:string|null; email:string|null; area_direito:string|null; descricao_interesse:string|null; canal:keyof typeof CANAIS_LEAD; status:keyof typeof STATUS_LEAD; valor_contrato:number|null; atualizado_em:string };
const dinheiro=(v:number)=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

export default function AtendimentoComercial(){
  const [busca,setBusca]=useState(""); const [selecionado,setSelecionado]=useState<string>();
  const {data:leads=[],isLoading}=useQuery({queryKey:["atendimento-comercial-leads"],queryFn:async()=>{
    const {data,error}=await supabase.from("mkt_leads").select("id,nome,whatsapp,email,area_direito,descricao_interesse,canal,status,valor_contrato,atualizado_em").order("atualizado_em",{ascending:false});
    if(error) throw error; return (data??[]) as Lead[];
  }});
  const filtrados=useMemo(()=>leads.filter(l=>`${l.nome} ${l.whatsapp??""} ${l.email??""}`.toLowerCase().includes(busca.toLowerCase())),[leads,busca]);
  const lead=leads.find(l=>l.id===selecionado)??filtrados[0];
  const abertos=leads.filter(l=>!["convertido","perdido"].includes(l.status));
  const convertidos=leads.filter(l=>l.status==="convertido");
  return <div className="space-y-6">
    <PageHeader title="Atendimento & Comercial" description="Funil, atendimentos e contratações em uma única operação"/>
    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardContent className="pt-6 flex items-center gap-3"><Users className="text-primary"/><div><p className="text-sm text-muted-foreground">Em andamento</p><p className="text-2xl font-bold">{abertos.length}</p></div></CardContent></Card>
      <Card><CardContent className="pt-6 flex items-center gap-3"><CheckCircle2 className="text-emerald-600"/><div><p className="text-sm text-muted-foreground">Convertidos</p><p className="text-2xl font-bold">{convertidos.length}</p></div></CardContent></Card>
      <Card className="border-amber-300 bg-amber-50/40"><CardContent className="pt-6 flex items-center gap-3"><AlertCircle className="text-amber-600"/><div><p className="font-medium">WhatsApp não configurado</p><p className="text-xs text-muted-foreground">A ativação depende do provedor e das credenciais oficiais.</p></div></CardContent></Card>
    </div>
    <Tabs defaultValue="atendimentos"><TabsList><TabsTrigger value="atendimentos">Atendimentos</TabsTrigger><TabsTrigger value="funil">Visão do funil</TabsTrigger></TabsList>
      <TabsContent value="atendimentos" className="mt-4"><div className="grid min-h-[560px] gap-4 lg:grid-cols-[320px_1fr_320px]">
        <Card><CardHeader><CardTitle className="text-base">Fila real</CardTitle><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/><Input className="pl-9" placeholder="Buscar atendimento" value={busca} onChange={e=>setBusca(e.target.value)}/></div></CardHeader><CardContent className="space-y-2 max-h-[470px] overflow-auto">
          {isLoading&&<p className="text-sm text-muted-foreground">Carregando…</p>}{!isLoading&&filtrados.length===0&&<p className="text-sm text-muted-foreground">Nenhum atendimento cadastrado.</p>}
          {filtrados.map(item=><button key={item.id} onClick={()=>setSelecionado(item.id)} className={`w-full rounded-lg border p-3 text-left transition ${lead?.id===item.id?"border-primary bg-primary/5":"hover:bg-muted/50"}`}><div className="flex justify-between gap-2"><strong className="truncate text-sm">{item.nome}</strong><Badge variant="outline">{STATUS_LEAD[item.status]?.label??item.status}</Badge></div><p className="mt-1 truncate text-xs text-muted-foreground">{item.descricao_interesse||item.area_direito||"Sem descrição"}</p></button>)}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>{lead?.nome??"Selecione um atendimento"}</CardTitle></CardHeader><CardContent className="flex h-[470px] flex-col items-center justify-center text-center"><MessageSquareText className="mb-4 h-12 w-12 text-muted-foreground"/><h3 className="font-semibold">Histórico de conversa indisponível</h3><p className="mt-2 max-w-md text-sm text-muted-foreground">Não exibimos mensagens simuladas. Quando o canal oficial for conectado, as conversas reais aparecerão aqui com rastreabilidade.</p><Button className="mt-5" variant="outline" disabled>Enviar mensagem</Button></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Contexto comercial</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">{lead?<><div><p className="text-muted-foreground">Contato</p><p className="font-medium">{lead.whatsapp||lead.email||"Não informado"}</p></div><div><p className="text-muted-foreground">Área</p><p className="font-medium capitalize">{lead.area_direito||"Não informada"}</p></div><div><p className="text-muted-foreground">Origem</p><p className="font-medium">{CANAIS_LEAD[lead.canal]?.label??lead.canal}</p></div><div><p className="text-muted-foreground">Valor registrado</p><p className="font-medium text-emerald-700">{dinheiro(Number(lead.valor_contrato||0))}</p></div><div><p className="text-muted-foreground">Próxima etapa</p><p>Acompanhar pelo funil e concluir a ficha de atendimento.</p></div></>:<p className="text-muted-foreground">Selecione um registro.</p>}</CardContent></Card>
      </div></TabsContent>
      <TabsContent value="funil" className="mt-4"><div className="grid gap-4 md:grid-cols-5">{Object.entries(STATUS_LEAD).map(([status,meta])=><Card key={status}><CardHeader><CardTitle className="text-sm">{meta.label}</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{leads.filter(l=>l.status===status).length}</p></CardContent></Card>)}</div></TabsContent>
    </Tabs>
  </div>;
}
