/* js/03b-who-snakes-data.js
   The WHO list of medically important venomous snakes (region, subregion, species) and the matching of records to it.
   Defines: buildWhoMap, tagWhoEntries
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   3b. WHO MEDICALLY IMPORTANT VENOMOUS SNAKES
   Source: WHO Guidelines for the production, control and regulation
   of snake antivenom immunoglobulins, Annex 5, TRS No. 1004
   (Tables A5.3-A5.6) — species considered
   of greatest medical importance per region, as a starting point
   for antivenom-production priorities. Not part of the original
   Tox-Prot export; matched here by organism binomial for context.
   ============================================================ */
var WHO_SNAKES = [
  {region:'Africa & the Middle East', subregions:[
    {name:'North Africa & Middle East', species:['Atractaspis andersonii','Naja arabica','Naja haje','Naja oxiana','Bitis arietans','Cerastes cerastes','Cerastes gasperettii','Daboia mauritanica','Daboia palaestinae','Echis borkini','Echis carinatus','Echis coloratus','Echis omanensis','Echis pyramidum','Macrovipera lebetina','Montivipera xanthina','Pseudocerastes persicus']},
    {name:'Central sub-Saharan Africa', species:['Dendroaspis jamesoni','Dendroaspis polylepis','Naja anchietae','Naja haje','Naja melanoleuca','Naja nigricollis','Bitis arietans','Bitis gabonica','Bitis nasicornis','Echis leucogaster','Echis ocellatus','Echis pyramidum']},
    {name:'Eastern sub-Saharan Africa', species:['Dendroaspis angusticeps','Dendroaspis jamesoni','Dendroaspis polylepis','Naja anchietae','Naja annulifera','Naja ashei','Naja haje','Naja melanoleuca','Naja mossambica','Naja nigricollis','Bitis arietans','Bitis gabonica','Bitis nasicornis','Echis pyramidum']},
    {name:'Southern sub-Saharan Africa', species:['Dendroaspis angusticeps','Dendroaspis polylepis','Naja anchietae','Naja annulifera','Naja mossambica','Naja nigricincta','Naja nivea','Bitis arietans']},
    {name:'Western sub-Saharan Africa', species:['Dendroaspis jamesoni','Dendroaspis polylepis','Dendroaspis viridis','Naja haje','Naja katiensis','Naja melanoleuca','Naja nigricollis','Naja senegalensis','Bitis arietans','Bitis gabonica','Bitis nasicornis','Bitis rhinoceros','Cerastes cerastes','Echis jogeri','Echis leucogaster','Echis ocellatus']}
  ]},
  {region:'Asia & Australasia', subregions:[
    {name:'Central Asia', species:['Naja oxiana','Echis carinatus','Gloydius halys','Macrovipera lebetina']},
    {name:'East Asia', species:['Bungarus multicinctus','Naja atra','Trimeresurus albolabris','Daboia russelii','Deinagkistrodon acutus','Gloydius blomhoffii','Gloydius brevicaudus','Protobothrops flavoviridis','Protobothrops mucrosquamatus','Trimeresurus stejnegeri']},
    {name:'South Asia', species:['Bungarus caeruleus','Bungarus ceylonicus','Bungarus niger','Bungarus sindanus','Bungarus walli','Naja kaouthia','Naja naja','Naja oxiana','Trimeresurus erythrurus','Daboia russelii','Echis carinatus','Hypnale hypnale','Macrovipera lebetina']},
    {name:'South-East Asia', species:['Bungarus candidus','Bungarus magnimaculatus','Bungarus multicinctus','Bungarus slowinskii','Naja atra','Naja kaouthia','Naja mandalayensis','Naja philippinensis','Naja samarensis','Naja siamensis','Naja sputatrix','Naja sumatrana','Calloselasma rhodostoma','Trimeresurus albolabris','Trimeresurus erythrurus','Trimeresurus insularis','Daboia siamensis','Deinagkistrodon acutus']},
    {name:'Australo-Papua', species:['Acanthophis laevis','Notechis scutatus','Oxyuranus scutellatus','Pseudechis australis','Pseudonaja affinis','Pseudonaja mengdeni','Pseudonaja nuchalis','Pseudonaja textilis']}
  ]},
  {region:'Europe', subregions:[
    {name:'Central Europe', species:['Vipera ammodytes']},
    {name:'Eastern Europe', species:['Vipera berus']},
    {name:'Western Europe', species:['Vipera aspis','Vipera berus']}
  ]},
  {region:'The Americas', subregions:[
    {name:'North America', species:['Agkistrodon bilineatus','Agkistrodon contortrix','Agkistrodon piscivorus','Agkistrodon taylori','Bothrops asper','Crotalus adamanteus','Crotalus atrox','Crotalus horridus','Crotalus oreganus','Crotalus simus','Crotalus scutulatus','Crotalus molossus','Crotalus viridis']},
    {name:'Caribbean', species:['Bothrops atrox','Bothrops caribbaeus','Bothrops lanceolatus','Crotalus durissus']},
    {name:'Central America', species:['Bothrops asper','Crotalus simus']},
    {name:'South America', species:['Bothrops alternatus','Bothrops asper','Bothrops atrox','Bothrops brazili','Bothrops bilineatus','Bothrops diporus','Bothrops jararaca','Bothrops jararacussu','Bothrops leucurus','Bothrops matogrossensis','Bothrops moojeni','Bothrops pictus','Bothrops venezuelensis','Crotalus durissus','Lachesis muta']}
  ]}
];

var WHO_SPECIES_MAP = {};   // lowercase "genus species" -> [{region, subregion}]
var WHO_SPECIES_LIST = [];  // flat de-duplicated list, for the insights view
function buildWhoMap(){
  var seen = {};
  WHO_SNAKES.forEach(function(r){
    r.subregions.forEach(function(sr){
      sr.species.forEach(function(sp){
        var key = sp.toLowerCase();
        if(!WHO_SPECIES_MAP[key]) WHO_SPECIES_MAP[key] = [];
        WHO_SPECIES_MAP[key].push({region:r.region, subregion:sr.name});
        if(!seen[key]){ seen[key]=true; WHO_SPECIES_LIST.push(sp); }
      });
    });
  });
}
function tagWhoEntries(){
  ENTRIES.forEach(function(e){
    var orgName = (e.org||'').split(' (')[0].trim().toLowerCase();
    var twoWord = orgName.split(/\s+/).slice(0,2).join(' '); // guards against trinomials
    e.who = WHO_SPECIES_MAP[orgName] || WHO_SPECIES_MAP[twoWord] || null;
  });
}