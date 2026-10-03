const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map();const element=s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:'',value:'6',style:{},focus(){}});return elements.get(s)};
const ctx={document:{querySelector:element,querySelectorAll:()=>[]},location:{hash:'#painel'},window:{addEventListener(){}},setTimeout(){},console,FormData};vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/app.js','utf8'),ctx);
assert.equal(vm.runInContext('actual()',ctx),53);
assert.equal(vm.runInContext('planned()',ctx),58);
vm.runInContext("record(6,15,'Cozinha','2026-10-02','Teste')",ctx);
assert.equal(vm.runInContext('pct(tasks[5])',ctx),50);
assert.equal(vm.runInContext('actual()',ctx),60.5);
assert.equal(vm.runInContext('entries.length',ctx),1);
assert.throws(()=>vm.runInContext("record(6,16,'Cozinha','2026-10-02','')",ctx));
assert.throws(()=>vm.runInContext("record(6,1,'Sala de estar','2026-10-02','')",ctx));
assert.equal(vm.runInContext('tasks[5].done',ctx),15);
for(const route of ['painel','cronograma','semana','planta','diario']){ctx.location.hash='#'+route;vm.runInContext('render()',ctx);assert.ok(element('#content').innerHTML.length>500)}
assert.equal(vm.runInContext("escapeText('<script>')",ctx),'&lt;script&gt;');
console.log('Verificado: cinco telas, avanço ponderado, atualização dos pisos, validação de saldo e ambiente, proteção do texto.');
