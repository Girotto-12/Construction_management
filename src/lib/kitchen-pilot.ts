import type {ScheduledTask} from './planning';
export const PILOT_KEY='obra-clara.primrose-kitchen.v1';
export const elements=[
 {id:'frame-back',name:'Framing · wall A / sink',task:'wall-frame',layer:'framing'},
 {id:'frame-side',name:'Framing · wall B / range',task:'wall-frame',layer:'framing'},
 {id:'plumbing',name:'Plumbing rough-in · sink wall',task:'plumbing',layer:'plumbing'},
 {id:'electrical',name:'Electrical rough-in · walls A + B',task:'electrical',layer:'electrical'},
 {id:'drywall-back',name:'Drywall · wall A / sink',task:'drywall',layer:'drywall'},
 {id:'drywall-side',name:'Drywall · wall B / range',task:'drywall',layer:'drywall'},
 {id:'floor',name:'Finish flooring · kitchen',task:'flooring',layer:'floor'}
] as const;
export type ElementId=typeof elements[number]['id'];
export type PilotEvent={id:string;element:ElementId;done:boolean;at:string};
export function readPilot(raw:string|null):PilotEvent[]{if(!raw)return [];const events=JSON.parse(raw);if(!Array.isArray(events)||events.some(e=>!e||typeof e.id!=='string'||!elements.some(x=>x.id===e.element)||typeof e.done!=='boolean'||typeof e.at!=='string'||isNaN(Date.parse(e.at))))throw Error('Não foi possível ler os registros do piloto. Dados preservados.');return events;}
export function completedPilot(events:PilotEvent[]):Set<ElementId>{const done=new Set<ElementId>();for(const event of events){if(event.done)done.add(event.element);else done.delete(event.element);}return done;}
export function simulatedPilot(tasks:ScheduledTask[],date:string):Set<ElementId>{return new Set(elements.filter(e=>{const t=tasks.find(t=>t.id===e.task);return !!t&&t.end<=date;}).map(e=>e.id));}
