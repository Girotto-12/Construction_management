import test from 'node:test';
import assert from 'node:assert/strict';
import {createResidentialPlan,validatePlan,schedulePlan,PLAN_KEY} from '../src/lib/planning';
test('US template preserves dependency gates, physical weights and independent storage',()=>{
 const p=validatePlan(createResidentialPlan());
 assert.equal(p.currency,'USD');
 assert.notEqual(PLAN_KEY,'obra-clara.planning.v1');
 assert.equal(new Set(p.tasks.map(t=>t.phase)).size,12);
 assert.equal(p.tasks.reduce((s,t)=>s+t.weight,0),100);
 const dates=schedulePlan(p);
 for(const task of dates) for(const id of task.predecessors) assert.ok(task.start>dates.find(t=>t.id===id)!.end);
 assert.equal(p.tasks.find(t=>t.id==='rough-check')!.weight,0);
 const late={...p,tasks:p.tasks.map(t=>t.id==='windows-order'?{...t,duration:200}:t)};
 assert.ok(schedulePlan(late).find(t=>t.id==='handover')!.end>dates.find(t=>t.id==='handover')!.end);
 assert.ok(p.resources.every(r=>r.unitCostCents===0));
});
