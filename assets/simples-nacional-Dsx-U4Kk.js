import{v as l}from"./index-DtiWNAtd.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=l("CircleUserRound",[["path",{d:"M18 20a6 6 0 0 0-12 0",key:"1qehca"}],["circle",{cx:"12",cy:"10",r:"4",key:"1h16sb"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=l("LockOpen",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 9.9-1",key:"1mm8w8"}]]),t=[{faixa:1,faixaMin:0,faixaMax:18e4,aliquota:.045,deducao:0},{faixa:2,faixaMin:180000.01,faixaMax:36e4,aliquota:.09,deducao:8100},{faixa:3,faixaMin:360000.01,faixaMax:72e4,aliquota:.102,deducao:12420},{faixa:4,faixaMin:720000.01,faixaMax:18e5,aliquota:.14,deducao:39780},{faixa:5,faixaMin:180000001e-2,faixaMax:36e5,aliquota:.22,deducao:183780},{faixa:6,faixaMin:360000001e-2,faixaMax:48e5,aliquota:.33,deducao:828e3}],x={IRPJ:.188,CSLL:.152,COFINS:.129,PIS:.028,ISS:.438,CPP:.065};function m(a,i){if(a<=0)return{faixa:1,rbt12:i,aliquotaNominal:0,aliquotaEfetiva:0,valorSimples:0,detalhamento:{}};const o=t.find(e=>i>=e.faixaMin&&i<=e.faixaMax)??t[t.length-1],n=i>0?Math.max((i*o.aliquota-o.deducao)/i,0):o.aliquota,r=a*n,c={};for(const[e,u]of Object.entries(x))c[e]=+(r*u).toFixed(2);return{faixa:o.faixa,rbt12:i,aliquotaNominal:+(o.aliquota*100).toFixed(2),aliquotaEfetiva:+(n*100).toFixed(4),valorSimples:+r.toFixed(2),detalhamento:c}}function q(a,i){return a<=0||i<=0?0:+(a*(i/100)).toFixed(2)}function S(a){return+(a.receitaTotal-a.repassesParceiros-a.valorSimples-a.valorMarketing-a.valorProLabore-a.outrasDespesas).toFixed(2)}const f=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];function h(a){return f[a-1]??String(a)}export{t as A,d as C,x as D,M as L,q as a,S as b,m as c,h as n};
