/* js/03a-helpers.js
   Small shared helpers: colour variable per animal group, HTML escaping, number formatting.
   Defines: catColorVar, esc, fmtN
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
function catColorVar(cat){
  if(/^Snake/.test(cat)) return 'var(--cat-snake)';
  if(/^Spider/.test(cat)) return 'var(--cat-spider)';
  if(/^Scorpion/.test(cat)) return 'var(--cat-scorpion)';
  if(/^Cone/.test(cat)) return 'var(--cat-cone)';
  if(/^Hymenoptera/.test(cat)) return 'var(--cat-hymenoptera)';
  if(/^Cnidarian/.test(cat)) return 'var(--cat-cnidarian)';
  if(/^Centipede/.test(cat)) return 'var(--cat-centipede)';
  if(/^Fish/.test(cat)) return 'var(--cat-fish)';
  if(/^Tick/.test(cat)) return 'var(--cat-tick)';
  if(/^Frog/.test(cat)) return 'var(--cat-frog)';
  if(/^Lizard/.test(cat)) return 'var(--cat-lizard)';
  if(/^Snail/.test(cat)) return 'var(--cat-snail)';
  if(/^Mammal/.test(cat)) return 'var(--cat-mammal)';
  if(/^Caterpillar/.test(cat)) return 'var(--cat-caterpillar)';
  if(/^Assassin/.test(cat)) return 'var(--cat-bug)';
  if(/^Wasp parasitoid/.test(cat)) return 'var(--cat-parasitoid)';
  return 'var(--cat-other)';
}

function esc(s){
  if(s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
function fmtN(n){ return n.toLocaleString('en-US'); }
