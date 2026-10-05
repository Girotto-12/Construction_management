import type {Purchase} from './material-purchases';
export const HEADERS=['Material','Quantity','Unit','Supplier','Total Cost (USD)','Purchase Date','Phase','Location','Status'];
export type ImportRow={row:number;item:Purchase;errors:string[];duplicate:boolean};
const norm=(s:string)=>s.trim().toLowerCase();
export const purchaseKey=(p:Purchase)=>JSON.stringify([norm(p.name),p.quantity,norm(p.unit),norm(p.vendor),p.totalCents,p.date,norm(p.phase),norm(p.location),p.status]);
export function reviewRows(rows:unknown[][],phases:string[],existing:Purchase[]):ImportRow[]{
 if(HEADERS.some((h,i)=>rows[0]?.[i]!==h)||rows[0]?.slice(9).some(v=>v!==null&&v!==''&&v!==undefined))throw Error('Cabeçalhos inválidos. Use o template e mantenha as nove colunas.');
 const seen=new Set(existing.map(purchaseKey));const result:ImportRow[]=[];
 rows.slice(1).forEach((r,index)=>{if(r.every(v=>v===null||v===undefined||v===''))return;
 if(result.length>=500)throw Error('Limite de 500 materiais por importação.');
 const errors:string[]=[];
 const str=(i:number,max=100)=>{const v=r[i];if(v!==null&&v!==undefined&&typeof v!=='string'){errors.push(HEADERS[i]+': use texto, sem fórmulas.');return '';}const s=String(v??'').trim();if(s.length>max)errors.push(HEADERS[i]+': texto muito longo.');return s;};
 const number=(i:number)=>{const v=r[i];if(typeof v!=='number'||!Number.isFinite(v)){errors.push(HEADERS[i]+': informe um número, não texto ou fórmula.');return NaN;}return v;};
 const name=str(0),quantity=number(1),unit=str(2,25),vendor=str(3),total=number(4),phase=str(6),location=str(7),statusLabel=str(8);
 let date='';const raw=r[5];if(raw instanceof Date&&!isNaN(raw.getTime()))date=raw.toISOString().slice(0,10);else if(raw!==null&&raw!==undefined&&raw!==''){if(typeof raw==='string')date=raw.trim();else errors.push('Purchase Date: use uma data Excel ou yyyy-mm-dd.');}
 if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date))errors.push('Purchase Date: data inválida.');
 if(!name||!unit||!phase||!location)errors.push('Preencha Material, Unit, Phase e Location.');
 if(!(quantity>0&&quantity<=1e9)||Math.abs(quantity*1000-Math.round(quantity*1000))>0.0001)errors.push('Quantity: maior que zero e até três casas decimais.');
 if(!(total>=0&&total<=1e9)||Math.abs(total*100-Math.round(total*100))>0.0001)errors.push('Total Cost: valor não negativo, com até duas casas decimais.');
 if(!phases.includes(phase))errors.push('Phase: fase não encontrada no planejamento atual.');
 const status=({'To purchase':'planned','Purchased':'ordered','Received':'received'} as Record<string,string>)[statusLabel];if(!status)errors.push('Status: use To purchase, Purchased ou Received.');
 if(r.slice(9).some(v=>v!==null&&v!==undefined&&v!==''))errors.push('Há dados fora das nove colunas do template.');
 const item:Purchase={id:crypto.randomUUID(),name,quantity,unit,vendor,totalCents:Math.round(total*100),date,phase,location,status:status??'planned'};
 const key=purchaseKey(item),duplicate=!errors.length&&seen.has(key);if(!errors.length)seen.add(key);
 result.push({row:index+2,item,errors,duplicate});});
 if(!result.length)throw Error('A aba Materials está vazia. Preencha a partir da linha 2.');return result;
}
export async function readMaterialWorkbook(data:ArrayBuffer,phases:string[],existing:Purchase[]){
 if(data.byteLength>2*1024*1024)throw Error('Use um arquivo XLSX de até 2 MB.');
 const {default:ExcelJS}=await import('exceljs');const wb=new ExcelJS.Workbook();await wb.xlsx.load(data);
 const sheet=wb.getWorksheet('Materials');if(!sheet)throw Error('Aba Materials não encontrada. Use o template.');
 if(sheet.rowCount>501||sheet.columnCount>9)throw Error('Use até 500 linhas, nas nove colunas do template.');
 const rows:unknown[][]=[];sheet.eachRow({includeEmpty:true},r=>{rows.push(Array.from({length:9},(_,i)=>r.getCell(i+1).value));});
 return reviewRows(rows,phases,existing);
}
