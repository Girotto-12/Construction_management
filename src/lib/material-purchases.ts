import {validateWithdrawal,protectReceivedPurchase,type Withdrawal} from "./material-withdrawals";
import Decimal from "decimal.js";
import {purchaseKey} from "./material-import";
export type Purchase = {id:string;name:string;quantity:number;unit:string;totalCents:number;vendor:string;date:string;phase:string;location:string;status:string;invoiceNumber?:string;dueDate?:string;unitCostCents?:number;shippingCents?:number;taxMode?:"manual"|"rate";taxRate?:number;shippingTaxable?:boolean;taxCents?:number;paidCents?:number;receipt?:File};
function database():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open('obra-clara.material-purchases.v1',2);r.onupgradeneeded=()=>{for(const name of ['purchases','withdrawals'])if(!r.result.objectStoreNames.contains(name))r.result.createObjectStore(name,{keyPath:'id'});};r.onblocked=()=>reject(Error('Feche outras abas antigas de materiais e tente novamente.')); r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result);};r.onerror=()=>reject(r.error);});}
export async function listPurchases():Promise<Purchase[]>{const db=await database();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('purchases','readonly'),r=tx.objectStore('purchases').getAll();tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
export async function savePurchase(item:Purchase){
 validatePurchaseFinance(item);
 if(!item.name.trim()||!item.phase||!item.location.trim()||!Number.isFinite(item.quantity)||item.quantity<=0||!Number.isSafeInteger(item.totalCents)||item.totalCents<0)throw Error('Confira material, quantidade, valor, fase e local.');
 if(item.receipt&&(!['application/pdf','image/jpeg','image/png','image/webp'].includes(item.receipt.type)||item.receipt.size>10*1024*1024))throw Error('Use PDF, JPG, PNG ou WebP de até 10 MB.');
 const db=await database();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(['purchases','withdrawals'],'readwrite');const store=tx.objectStore('purchases'),old=store.get(item.id),rows=tx.objectStore('withdrawals').getAll();let failure:unknown;rows.onsuccess=()=>{try{protectReceivedPurchase(old.result,item,rows.result);store.put(item);}catch(e){failure=e;tx.abort();}};tx.oncomplete=()=>resolve();tx.onerror=()=>reject(failure??tx.error);tx.onabort=()=>reject(failure??tx.error??Error('Compra não salva.'));});}finally{db.close();}
}

export async function importPurchases(items:Purchase[]):Promise<number>{
 const db=await database();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('purchases','readwrite'),store=tx.objectStore('purchases'),read=store.getAll();let count=0;
 read.onsuccess=()=>{const keys=new Set((read.result as Purchase[]).map(purchaseKey));for(const item of items){const key=purchaseKey(item);if(!keys.has(key)){store.add(item);keys.add(key);count++;}}};
 tx.oncomplete=()=>resolve(count);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error??Error('Importação cancelada. Nenhum item salvo.'));});}finally{db.close();}
}

export function validatePurchaseFinance(item:Purchase){
 if(item.taxMode==="rate"){if(item.unitCostCents===undefined||item.shippingCents===undefined||item.taxRate===undefined||typeof item.shippingTaxable!=="boolean")throw Error("Confira a configuração do imposto.");const subtotal=calculatePurchaseTotal(item.quantity,item.unitCostCents,0,0);if(calculateSalesTax(subtotal,item.shippingCents,item.taxRate,item.shippingTaxable)!==item.taxCents)throw Error("Imposto não corresponde à alíquota e à base informadas.");}

 if(item.unitCostCents!==undefined){if(item.taxCents===undefined||item.shippingCents===undefined)throw Error("Informe impostos e shipping, mesmo que zero.");if(calculatePurchaseTotal(item.quantity,item.unitCostCents,item.taxCents,item.shippingCents)!==item.totalCents)throw Error("Total deve corresponder a quantidade × preço unitário + impostos + shipping.");}

 for(const [name,value] of [['Impostos',item.taxCents],['Valor pago',item.paidCents]] as const){if(value!==undefined&&(!Number.isSafeInteger(value)||value<0||value>item.totalCents))throw Error(name+': informe um valor entre zero e o total da compra.');}
 if(item.invoiceNumber!==undefined&&(typeof item.invoiceNumber!=='string'||item.invoiceNumber.length>100))throw Error('Número da fatura inválido.');
 if(item.dueDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(item.dueDate)||isNaN(Date.parse(item.dueDate))||new Date(item.dueDate).toISOString().slice(0,10)!==item.dueDate))throw Error('Vencimento inválido.');
 if(item.status==='planned'&&(item.paidCents??0)>0)throw Error('Para registrar pagamento, altere a situação para comprado ou recebido.');
}
export function paymentLabel(item:Purchase){if(item.paidCents===undefined)return 'Não informado';if(item.paidCents===0)return item.totalCents===0?'Sem valor a pagar':'Não pago';return item.paidCents===item.totalCents?'Pago':'Parcialmente pago';}

export function calculatePurchaseTotal(quantity:number,unitCostCents:number,taxCents:number,shippingCents:number){
 if(!Number.isFinite(quantity)||quantity<=0||quantity>1e9)throw Error('Quantidade inválida.');
 for(const n of [unitCostCents,taxCents,shippingCents])if(!Number.isSafeInteger(n)||n<0)throw Error('Informe valores monetários não negativos em centavos.');
 const total=new Decimal(quantity).mul(unitCostCents).toDecimalPlaces(0,Decimal.ROUND_HALF_UP).plus(taxCents).plus(shippingCents).toNumber();
 if(!Number.isSafeInteger(total)||total>1e11)throw Error('Total acima do limite permitido.');return total;
}
export function inputCents(raw:string){if(!/^\d+(\.\d{1,2})?$/.test(raw))throw Error('Informe valores em USD com até duas casas decimais.');const value=new Decimal(raw).mul(100).toNumber();if(!Number.isSafeInteger(value))throw Error('Valor monetário inválido.');return value;}

export function calculateSalesTax(subtotalCents:number,shippingCents:number,rate:number,shippingTaxable:boolean){
 if(!Number.isFinite(rate)||rate<0||rate>100||new Decimal(rate).decimalPlaces()>4)throw Error('Sales tax deve estar entre 0 e 100%, com até quatro casas decimais.');
 for(const n of [subtotalCents,shippingCents])if(!Number.isSafeInteger(n)||n<0)throw Error('Base tributável inválida.');
 return new Decimal(subtotalCents).plus(shippingTaxable?shippingCents:0).mul(rate).div(100).toDecimalPlaces(0,Decimal.ROUND_HALF_UP).toNumber();
}

export async function listWithdrawals():Promise<Withdrawal[]>{const db=await database();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('withdrawals','readonly'),r=tx.objectStore('withdrawals').getAll();tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
export async function saveWithdrawal(input:Withdrawal){const db=await database();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(['purchases','withdrawals'],'readwrite'),store=tx.objectStore('withdrawals'),p=tx.objectStore('purchases').get(input.purchaseId),rows=store.getAll();let failure:unknown;rows.onsuccess=()=>{try{if(rows.result.some((r:Withdrawal)=>r.id===input.id))throw Error('Esta retirada já foi registrada.');validateWithdrawal(p.result,rows.result,input);store.add({...input,material:p.result.name,unit:p.result.unit,createdAt:new Date().toISOString()});}catch(e){failure=e;tx.abort();}};tx.oncomplete=()=>resolve();tx.onerror=()=>reject(failure??tx.error);tx.onabort=()=>reject(failure??tx.error??Error('Retirada não salva.'));});}finally{db.close();}}
