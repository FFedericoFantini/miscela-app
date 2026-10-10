const assert=require('node:assert/strict'),P=require('../dist/planner.js'),M=require('../dist/recipes-model.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
for(const [recipeId,dose,rate,unit] of [['herbicide',2.25,300,'L'],['insecticide',1.25,600,'L'],['fungicide',1,300,'L'],['nutritional',1.8,60,'kg']]){
 for(const area of [0.1,1,5,6.37])for(const technical of [0,5]){
  const p=P.plan({fieldName:'Campo',area,capacity:1000,technical,recipeId});
  near(p.requirements.totalMixture,area*rate);near(p.requirements.products[0].quantity,area*dose);assert.equal(p.requirements.products[0].unit,unit);
  near(p.totalPrepared,area*rate+technical);near(p.productsPrepared[0].quantity,(area*rate+technical)/rate*dose);near(p.loads.reduce((a,l)=>a+l.area,0),area);
  for(const l of p.loads){assert.ok(l.targetVolume<=1000+1e-8);near(l.products[0].quantity,l.addVolume/rate*dose);assert.equal(l.steps.length,3);assert.equal(l.steps[2].amount,l.targetVolume);}
 }
}
const two=P.plan({area:'5,0',capacity:'1000',technical:'0',recipeId:'herbicide'});assert.equal(two.loads.length,2);near(two.loads[0].targetVolume,1000);near(two.loads[1].targetVolume,500);near(two.loads[0].products[0].quantity,7.5);near(two.loads[1].products[0].quantity,3.75);
const t=P.plan({area:5,capacity:1000,technical:5,recipeId:'herbicide'});near(t.loads[1].targetVolume,510);near(t.loads[1].addVolume,505);near(t.loads[1].products[0].quantity,3.7875);
const j=P.create({area:5,capacity:1000,technical:5,recipeId:'insecticide'},1000);assert.equal(P.confirm(j,0,0),false);assert.equal(P.start(j),true);assert.equal(P.start(j),false);
for(let i=0;i<j.loads.length;i++){
 for(let k=0;k<3;k++){assert.equal(P.confirm(j,i,k,1001+i*10+k),true);assert.equal(P.confirm(j,i,k,2000),false);}
 assert.equal(j.status,'ready');assert.equal(P.next(j,i,3000+i),true);assert.equal(P.next(j,i,3000+i),false);
}
assert.equal(j.status,'completed');assert.equal(j.confirmations.length,j.loads.length*3);assert.equal(j.usedLoads.length,j.loads.length-1);assert.ok(j.finishedAt>j.createdAt);
assert.throws(()=>P.plan({area:0,capacity:1000,technical:5,recipeId:'herbicide'}));assert.throws(()=>P.plan({area:1,capacity:5,technical:5,recipeId:'herbicide'}));assert.throws(()=>P.plan({area:1,capacity:1000,technical:5,recipeId:'bad'}));assert.ok(Number.isNaN(P.number('1e4')));
assert.ok(M.disclaimer.includes('etichetta vigente'));
console.log('PASS: 4 ricette; dosi L/kg; superficie decimale; carichi completi/parziali; volume finale; volume tecnico distinto; bilancio prodotti/acqua; 3 conferme per carico; nessun salto/duplicato; valori non validi bloccati.');
