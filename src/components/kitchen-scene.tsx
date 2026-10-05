"use client";
import {useState} from 'react';
import type {ElementId} from '@/lib/kitchen-pilot';
type V=[number,number,number];type Box={p:V;s:V;color:string;opacity?:number};
export function KitchenScene({done,xray}:{done:Set<ElementId>;xray:boolean}){
 const [angle,setAngle]=useState(35);const boxes:Box[]=[];
 const box=(p:V,s:V,color:string,opacity=1)=>boxes.push({p,s,color,opacity});
 const W=14.54,D=12,H=10;
 box([0,-.22,0],[W,.2,D],'#c4d2d5');
 if(done.has('floor')){for(let z=0;z<D;z+=.65)box([0,0,z],[W,.05,.61],'#c3a17b');}
 const timber='#caa57b';
 if(done.has('frame-back')){box([0,0,0],[W,.16,.3],timber);box([0,H-.3,0],[W,.3,.3],timber);for(let x=0;x<W;x+=1.33){if(x>5&&x<10){box([x,.16,0],[.13,3.84,.3],timber);box([x,8,0],[.13,1.7,.3],timber);}else box([x,.16,0],[.13,H-.46,.3],timber);}box([5,4,0],[5,.16,.3],timber);box([5,8,0],[5,.3,.3],timber);}
 if(done.has('frame-side')){box([0,0,0],[.3,.16,D],timber);box([0,H-.3,0],[.3,.3,D],timber);for(let z=0;z<D;z+=1.33)box([0,.16,z],[.3,H-.46,.13],timber);}
 if(done.has('plumbing')){box([7,.1,.45],[.1,3.3,.1],'#368ec3');box([7.5,.1,.45],[.1,3.3,.1],'#d96d69');box([8,.1,.45],[.2,2.4,.2],'#687c83');}
 if(done.has('electrical')){box([.4,2,.42],[W-.8,.07,.07],'#d6a62a');box([.42,2,.4],[.07,.07,D-.8],'#d6a62a');for(const x of [2,4,11,13])box([x,1.85,.42],[.23,.4,.16],'#d6a62a');for(const z of [3,7,10])box([.42,1.85,z],[.16,.4,.23],'#d6a62a');}
 const opacity=xray?.2:1;
 if(done.has('drywall-back')){box([0,0,.65],[5,H,.08],'#ebeff0',opacity);box([10,0,.65],[W-10,H,.08],'#ebeff0',opacity);box([5,0,.65],[5,4,.08],'#ebeff0',opacity);box([5,8,.65],[5,2,.08],'#ebeff0',opacity);}
 if(done.has('drywall-side'))box([.65,0,0],[.08,H,D],'#e1e7e9',opacity);
 const rad=angle*Math.PI/180;
 const project=([x,y,z]:V):V=>{x-=W/2;z-=D/2;return [420+(x*Math.cos(rad)-z*Math.sin(rad))*29,340+(x*Math.sin(rad)+z*Math.cos(rad))*11-y*25,x*Math.sin(rad)+z*Math.cos(rad)];};
 const faces=boxes.flatMap(b=>{const [x,y,z]=b.p,[w,h,d]=b.s;const verts:V[]=[[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z],[x,y,z+d],[x+w,y,z+d],[x+w,y+h,z+d],[x,y+h,z+d]];return [[3,2,6,7],[0,1,2,3],[1,5,6,2],[4,7,6,5],[0,3,7,4]].map((ids,i)=>{const pts=ids.map(n=>project(verts[n]));return {order:b.color==='#c4d2d5'?0:b.color==='#c3a17b'?1:2,points:pts.map(p=>p[0]+','+p[1]).join(' '),depth:pts.reduce((s,p)=>s+p[2],0)/4,color:b.color,opacity:b.opacity,shade:i};});}).sort((a,b)=>a.order-b.order||a.depth-b.depth);
 return <div><svg viewBox="0 0 840 530" role="img" aria-label="Modelo esquemático da cozinha, com camadas de execução. Dimensões horizontais e instalações aproximadas."><defs><pattern id="pilot-grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e8eef0" strokeWidth="1"/></pattern></defs><rect width="840" height="530" fill="url(#pilot-grid)"/>{faces.map((f,i)=><polygon key={i} points={f.points} fill={f.color} fillOpacity={f.opacity} stroke="#526771" strokeOpacity={.2*(f.opacity??1)} strokeWidth=".7"/>)}<text x="30" y="35" fill="#173d50" fontSize="17">KITCHEN · MAIN LEVEL</text><text x="30" y="500" fill="#526771" fontSize="13">Open cutaway · walls A + B · schematic geometry</text></svg><label className="pilot-camera">Rotate view <input aria-label="Rotate view" type="range" min="10" max="65" value={angle} onChange={e=>setAngle(Number(e.target.value))}/></label></div>;
}
