"use client";
import { useState } from 'react';
import type { ScheduledTask } from '@/lib/planning';
const day = (date:string) => Date.parse(date+'T00:00:00Z')/86400000;
const dateLabel = (date:string) => new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T00:00:00Z'));
export function PlanningGantt({tasks,onEdit,onInsert}:{tasks:ScheduledTask[];onInsert:(id:string)=>void;onEdit:(id:string)=>void}) {
 const [collapsed,setCollapsed]=useState<Set<string>>(()=>new Set());
 const [zoom,setZoom]=useState(4);
 const [selected,setSelected]=useState<string|null>(null);
 const groups=Array.from(new Set(tasks.map(t=>t.phase||'Other activities'))).map(name=>({name,tasks:tasks.filter(t=>(t.phase||'Other activities')===name)}));
 const start=Math.min(...tasks.map(t=>day(t.start))),end=Math.max(...tasks.map(t=>day(t.end)));
 const width=(end-start+1)*zoom;
 const current=tasks.find(t=>t.id===selected);
 const ticks=[];
 for(let d=start;d<=end;d+=(zoom===4?28:7)) ticks.push(d);
 const bar=(a:string,b:string)=>({left:(day(a)-start)*zoom,width:Math.max(3,(day(b)-day(a)+1)*zoom)});
 return <section className="schedule-gantt" aria-label="Construction schedule Gantt">
 <div className="gantt-toolbar"><div><h3>WBS & Gantt</h3><p>Select an activity to see its dependencies. Select its name to edit.</p></div><div className="planning-actions"><button className="button secondary" onClick={()=>setCollapsed(new Set())}>Expand all</button><button className="button secondary" onClick={()=>setCollapsed(new Set(groups.map(g=>g.name)))}>Collapse all</button><label>Zoom <select value={zoom} onChange={e=>setZoom(Number(e.target.value))}><option value={4}>Overview</option><option value={12}>Weekly</option><option value={24}>Detailed</option></select></label></div></div>
 <p className="panel-note">{dateLabel(new Date(start*86400000).toISOString().slice(0,10))} – {dateLabel(new Date(end*86400000).toISOString().slice(0,10))} · Calendar axis includes weekends; activities follow the working calendar. Bars represent planned dates.</p>
 <div className="gantt-scroll" tabIndex={0} role="region" aria-label="Scrollable schedule timeline"><div style={{width:340+width}}>
 <div className="gantt-row gantt-header"><div className="gantt-label">Activity / responsible trade</div><div className="gantt-track" style={{width}}>{ticks.map(d=><span key={d} className="gantt-tick" style={{left:(d-start)*zoom}}>{new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(d*86400000))}</span>)}</div></div>
 {groups.map((g,i)=>{const a=g.tasks.map(t=>t.start).sort()[0],b=g.tasks.map(t=>t.end).sort().at(-1)!;return <div key={g.name}><div className="gantt-row gantt-phase"><div className="gantt-label"><button aria-expanded={!collapsed.has(g.name)} onClick={()=>setCollapsed(prev=>{const next=new Set(prev);if(next.has(g.name))next.delete(g.name);else next.add(g.name);return next;})}>{collapsed.has(g.name)?'▸':'▾'} {i+1}. {g.name} <small>({g.tasks.length})</small></button></div><div className="gantt-track" style={{width}}><span className="gantt-summary" style={bar(a,b)} title={dateLabel(a)+' – '+dateLabel(b)}/></div></div>
 {!collapsed.has(g.name)&&g.tasks.map((t,j)=><div className="gantt-row" key={t.id}><div className="gantt-label"><button onClick={()=>onEdit(t.id)}>{i+1}.{j+1} {t.name}</button><small>{t.owner||'Unassigned'} · {t.duration} workdays</small><button className="gantt-insert" aria-label={'Insert below '+t.name} onClick={()=>onInsert(t.id)}>+ Insert below</button></div><div className="gantt-track" style={{width,backgroundSize:7*zoom+'px 100%'}}><button className={'gantt-bar '+(selected===t.id?'is-selected':current?.predecessors.includes(t.id)?'is-predecessor':'')} style={bar(t.start,t.end)} onClick={()=>setSelected(t.id)} aria-label={t.name+': '+dateLabel(t.start)+' to '+dateLabel(t.end)} aria-pressed={selected===t.id} title={t.name+' · '+dateLabel(t.start)+' – '+dateLabel(t.end)}/></div></div>)}
 </div>})}</div></div>
 <div className="gantt-selection" aria-live="polite">{current?<><strong>{current.name}</strong><p>{dateLabel(current.start)} – {dateLabel(current.end)} · {current.duration} workdays</p><p>Predecessors: {current.predecessors.map(id=>tasks.find(t=>t.id===id)?.name).join(', ')||'Project start'}</p><p>Successors: {tasks.filter(t=>t.predecessors.includes(current.id)).map(t=>t.name).join(', ')||'None'}</p><small>Selected activity: dark blue. Predecessors: amber. Finish-to-start dependencies.</small></>:<span>Select a bar to inspect the activity and its dependencies.</span>}</div>
 </section>;
}
