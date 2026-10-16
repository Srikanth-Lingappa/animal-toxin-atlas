/* js/03-state.js
   Shared state used everywhere: the record list, current filters and sort, selections, and tab switching.
   Defines: switchToTab
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   3. STATE
   ============================================================ */
var DATA = null;         // {kwList, famList, catList, entries}
var ENTRIES = [];        // raw entries with precomputed search blob
var KW_COUNT = [];        // counts per keyword index
var CAT_COUNT = {};       // category name -> count
var FAM_COUNT = [];       // counts per family index
var CLASS_COUNT = [];     // counts per toxin-class index
var IPR_COUNT = [];       // counts per InterPro entry index
var MF_LIST = [];         // {term, go} — unique GO molecular function terms found in this dataset
var MF_COUNT = [];        // counts per MF_LIST index

var state = {
  q: '',
  cats: new Set(),        // selected category names
  kws: new Set(),         // selected keyword indices
  fam: '',                // selected family index (string) or ''
  cls: '',                // selected toxin-class index (string) or ''
  ipr: '',                // selected InterPro entry index (string) or ''
  mf: '',                 // selected mechanism-of-action (GO molecular function) index (string) or ''
  lenMin: null,
  lenMax: null,
  has3d: false,
  hasEc: false,
  hasWho: false,
  excludeFrag: false,
  pe: '',
  sort: 'org',
  page: 1
};
var PAGE_SIZE = 30;
var filteredCache = null;
var FAM_TO_CLASS = [];    // family index -> class index (or null)

var TAB_IDS = ['browse','search','stats','convergence','insights','who','organism','disulfides','taxon','about'];
function switchToTab(tab){
  document.querySelectorAll('.viewtabs button[data-tab]').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-tab')===tab);
  });
  TAB_IDS.forEach(function(t){
    var el = document.getElementById('tab-'+t);
    if(el) el.style.display = (t===tab) ? '' : 'none';
  });
  if(tab==='convergence') embOnShow();
}

var CAT_ORDER = [
  'Snake','Spider','Scorpion','Cone snail','Hymenoptera (bee/wasp/ant)',
  'Cnidarian (jellyfish/anemone/hydra/coral)','Centipede','Fish (venomous)',
  'Tick/Mite','Frog/Toad (amphibian)','Lizard','Snail (other)',
  'Mammal (venomous)','Caterpillar/Moth','Assassin bug/True bug',
  'Wasp parasitoid','Other/Unclassified'
];
