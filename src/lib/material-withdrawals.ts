import Decimal from 'decimal.js';import type {Purchase} from './material-purchases';
export type Withdrawal={id:string;purchaseId:string;material:string;unit:string;quantity:number;date:string;responsible:string;phase:string;location:string;note:string;createdAt:string};
export function availableMaterial(p:Purchase,rows:Withdrawal[]){return rows.filter(r=>r.purchaseId===p.id).reduce((s,r)=>s.minus(r.quantity),new Decimal(p.quantity)).toNumber();}
export function validateWithdrawal(p:Purchase|undefined,rows:Withdrawal[],r:Withdrawal){
 if(!p||p.status!=='received')throw Error('Selecione um material recebido.');
 if(!Number.isFinite(r.quantity)||r.quantity<=0||new Decimal(r.quantity).decimalPlaces()>3)throw Error('Quantidade deve ser positiva, com até três casas decimais.');
 if(r.quantity>availableMaterial(p,rows))throw Error('Quantidade superior ao saldo disponível. Atualize a lista.');
 if(!r.responsible.trim()||!r.phase.trim()||!r.location.trim()||[r.responsible,r.phase,r.location].some(v=>v.length>100)||r.note.length>500)throw Error('Confira responsável, fase, local e observação.');
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Denver',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 if(!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||isNaN(Date.parse(r.date))||new Date(r.date).toISOString().slice(0,10)!==r.date||r.date>today)throw Error('Informe uma data válida, não futura.');
}
export function protectReceivedPurchase(previous:Purchase|undefined,next:Purchase,rows:Withdrawal[]){if(!previous||!rows.some(r=>r.purchaseId===next.id))return;if(next.status!=='received'||next.unit!==previous.unit||next.name!==previous.name||availableMaterial(next,rows)<0)throw Error('Material com retiradas: mantenha nome, unidade, situação recebido e quantidade suficiente para as saídas.');}
