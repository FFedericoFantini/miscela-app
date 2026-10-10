(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MixtureGuideModel = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const units = new Set(['g', 'kg', 'mL', 'L']);
  const EPS = 1e-8;
  const disclaimer = 'Configurazione dimostrativa. Per l’impiego reale verificare sempre l’etichetta vigente del prodotto e le condizioni specifiche della coltura.';
  // Dose e volume sono configurazioni scelte dall'operatore, non prescrizioni agronomiche.
  // Documentazione dei produttori verificata il 09/10/2026. La ricetta resta non validata per un campo reale.
  const treatmentRecipes = {
    herbicide: {category:'Erbicida',treatmentName:'Diserbo mais',product:'Laudis®',productId:'laudis',manufacturer:'Bayer Crop Science',crop:'Mais',target:'Controllo infestanti in post-emergenza',dose:2.25,doseUnit:'L/ha',sprayVolumePerHa:300,
      productUrl:'https://www.cropscience.bayer.it/prodotti/erbicidi/laudis',documentationUrl:'https://www.cropscience.bayer.it/-/media/Prodotti/Laudis/Etichetta_Laudis.pdf',
      preparation:[{kind:'water',fraction:.5,note:'Mantieni l’agitazione indicata in etichetta.'},{kind:'product',productId:'laudis'},{kind:'final',note:'Completa il volume mantenendo l’agitazione indicata in etichetta.'}]},
    insecticide: {category:'Insetticida',treatmentName:'Controllo piralide mais',product:'Decis® Top',productId:'decis-top',manufacturer:'Bayer Crop Science',crop:'Mais',target:'Piralide',dose:1.25,doseUnit:'L/ha',sprayVolumePerHa:600,
      productUrl:'https://www.cropscience.bayer.it/prodotti/insetticidi-nematocidi/decis-top',documentationUrl:'https://www.cropscience.bayer.it/-/media/Prodotti/Decis-Top/ETI_Decis-Top.pdf',
      preparation:[{kind:'water'},{kind:'product',productId:'decis-top',note:'Prediluisci il prodotto in poca acqua come indicato in etichetta.'},{kind:'final',note:'Completa il volume mantenendo l’agitazione indicata in etichetta.'}]},
    fungicide: {category:'Fungicida',treatmentName:'Protezione fungina mais',product:'Propulse®',productId:'propulse',manufacturer:'Bayer Crop Science',crop:'Mais',target:'Fusariosi',dose:1,doseUnit:'L/ha',sprayVolumePerHa:300,
      productUrl:'https://www.cropscience.bayer.it/prodotti/fungicidi/propulse',documentationUrl:'https://www.cropscience.bayer.it/-/media/Prodotti/Propulse/ETI_PROPULSE.pdf',
      preparation:[{kind:'water'},{kind:'product',productId:'propulse'},{kind:'final',note:'Segui le indicazioni di preparazione e agitazione del prodotto.'}]},
    nutritional: {category:'Nutrizionale',treatmentName:'Nutrizione fogliare',product:'Poly-Feed™ Foliar 21-21-21',productId:'poly-feed',manufacturer:'Haifa Group',crop:'Patata',target:'Crescita vegetativa',dose:1.8,doseUnit:'kg/ha',concentration:3,concentrationUnit:'kg/100 L di miscela',sprayVolumePerHa:60,
      productUrl:'https://www.haifa-group.com/poly-feed%E2%84%A2-foliar',documentationUrl:'https://www.haifa-group.com/crop-guide-potato/potato-fertilizer-recommendations',
      preparation:[{kind:'water'},{kind:'product',productId:'poly-feed'},{kind:'final',note:'Segui le indicazioni di dissoluzione e preparazione del produttore.'}]},
  };
  const recipes = Object.entries(treatmentRecipes).map(([id,r])=>({
    ...r,id,name:r.treatmentName,problem:r.target,rate:r.sprayVolumePerHa,version:'demo-2.0',validated:false,validatedBy:null,validatedAt:null,documentationCheckedAt:'2026-10-09',
    products:[{id:r.productId,name:r.product,manufacturer:r.manufacturer,dose:r.dose,unit:r.doseUnit.split('/')[0]}],sequence:r.preparation.map(s=>({...s})),
  }));
  const recipeById = id => recipes.find(r => r.id === id);
  function finitePositive(value, label, allowZero = false) {
    if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) throw new Error(label + ': inserisci un numero ' + (allowZero ? 'maggiore o uguale a zero.' : 'maggiore di zero.'));
    return value;
  }
  function validateMachine(machine) {
    finitePositive(machine.capacity, 'Capacità utile'); finitePositive(machine.technical, 'Volume tecnico', true);
    if (machine.technical >= machine.capacity) throw new Error('Il volume tecnico deve essere inferiore alla capacità utile.');
  }
  function planLoad(treatment, machine, recipe) {
    validateMachine(machine); finitePositive(recipe.rate, 'Volume per ettaro');
    if (!treatment.compositionKnown) throw new Error('Composizione incerta: rabbocco bloccato. Chiudi il trattamento e raccogli la miscela.');
    finitePositive(treatment.area, 'Superficie'); finitePositive(treatment.coveredArea, 'Superficie percorsa', true);
    if (treatment.recipeId !== recipe.id || treatment.recipeVersion !== recipe.version) throw new Error('Il rabbocco deve usare la stessa ricetta e versione del trattamento.');
    const remainingArea = Math.max(0, treatment.area - treatment.coveredArea);
    const required = remainingArea * recipe.rate;
    const targetVolume = Math.min(machine.capacity, required + machine.technical);
    const existing = finitePositive(treatment.tankVolume, 'Miscela presente', true);
    if (existing > machine.capacity + EPS) throw new Error('Il volume presente supera la capacità utile.');
    const addVolume = Math.max(0, targetVolume - existing);
    const loads = required < EPS ? 0 : Math.max(1, Math.ceil((required - Math.max(0, existing - machine.technical) - EPS) / (machine.capacity - machine.technical)));
    const products = recipe.products.map(p => {
      if (!units.has(p.unit)) throw new Error('Unità non supportata: ' + p.unit);
      finitePositive(p.dose, 'Dose');
      return { ...p, quantity: addVolume / recipe.rate * p.dose };
    });
    return { existing, addVolume, targetVolume: existing + addVolume, remainingArea, loads, lastLoad: required <= machine.capacity - machine.technical + EPS, products };
  }
  function preparationSteps(recipe, load) {
    return recipe.sequence.map((step, index) => {
      const out = { ...step, id: index, confirmed: false };
      if (step.kind === 'product') {
        const p = load.products.find(p => p.id === step.productId);
        if (!p) throw new Error('Prodotto non configurato nella ricetta.');
        Object.assign(out, { name: p.name, amount: p.quantity, unit: p.unit });
      } else if (step.kind === 'water') Object.assign(out, { amount: Number.isFinite(step.fraction) ? load.existing + load.addVolume * step.fraction : null, unit: 'L' });
      else if (step.kind === 'final') Object.assign(out, { amount: load.targetVolume, unit: 'L' });
      else throw new Error('Passaggio non supportato.');
      return out;
    });
  }
  function fieldRequirements(area, recipe) {
    finitePositive(area,'Superficie');
    return {totalMixture:area*recipe.rate,products:recipe.products.map(p=>({...p,quantity:area*p.dose}))};
  }
  return { recipes, treatmentRecipes, disclaimer, recipeById, fieldRequirements, validateMachine, planLoad, preparationSteps, EPS };
});
