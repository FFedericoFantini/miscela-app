(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./recipes-model.js'):root.MixtureGuideModel);if(typeof module==='object'&&module.exports)module.exports=api;else root.MixtureGuidePlanner=api;})(typeof window==='undefined'?globalThis:window,function(M){
  'use strict';
  function number(value){const s=String(value).trim().replace(',','.');if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(s))return NaN;return Number(s);}
  function plan(settings){
    const recipe=M.recipeById(settings.recipeId);if(!recipe)throw new Error('Seleziona una ricetta disponibile.');
    const area=number(settings.area),machine={capacity:number(settings.capacity),technical:number(settings.technical)};
    M.validateMachine(machine);const requirements=M.fieldRequirements(area,recipe);
    if(area<=M.EPS)throw new Error('La superficie inserita è troppo piccola per calcolare un carico.');
    if(Math.ceil(requirements.totalMixture/(machine.capacity-machine.technical))>1000)throw new Error('Servirebbero oltre 1.000 carichi. Verifica superficie e capacità del serbatoio.');
    const treatment={area,coveredArea:0,tankVolume:0,compositionKnown:true,recipeId:recipe.id,recipeVersion:recipe.version};
    const loads=[];
    while(area-treatment.coveredArea>M.EPS){
      const load=M.planLoad(treatment,machine,recipe),usable=load.targetVolume-machine.technical;
      const covered=Math.min(area-treatment.coveredArea,usable/recipe.rate);
      if(!(covered>0))throw new Error('Il carico non copre una superficie utilizzabile. Verifica i dati.');
      loads.push({...load,number:loads.length+1,area:covered,steps:M.preparationSteps(recipe,load)});
      treatment.coveredArea+=covered;treatment.tankVolume=machine.technical;
    }
    return {fieldName:String(settings.fieldName||'Il mio campo').trim().slice(0,80)||'Il mio campo',area,machine,recipeId:recipe.id,recipeVersion:recipe.version,requirements,loads,
      totalPrepared:loads.reduce((sum,l)=>sum+l.addVolume,0),productsPrepared:recipe.products.map(p=>({...p,quantity:loads.reduce((sum,l)=>sum+l.products.find(x=>x.id===p.id).quantity,0)}))};
  }
  function create(settings,at=Date.now()){return {...plan(settings),id:String(at),createdAt:at,status:'planned',loadIndex:0,stepIndex:0,confirmations:[],usedLoads:[],finishedAt:null};}
  function start(job){if(job.status!=='planned')return false;job.status='preparing';return true;}
  function confirm(job,loadIndex,stepIndex,at=Date.now()){
    if(job.status!=='preparing'||job.loadIndex!==loadIndex||job.stepIndex!==stepIndex)return false;
    job.confirmations.push({loadIndex,stepIndex,at});job.stepIndex++;
    if(job.stepIndex===job.loads[job.loadIndex].steps.length)job.status='ready';return true;
  }
  function next(job,loadIndex,at=Date.now()){
    if(job.status!=='ready'||job.loadIndex!==loadIndex)return false;
    if(job.loadIndex===job.loads.length-1){job.status='completed';job.finishedAt=at;}
    else{job.usedLoads.push({loadIndex,at});job.loadIndex++;job.stepIndex=0;job.status='preparing';}return true;
  }
  return {number,plan,create,start,confirm,next};
});
