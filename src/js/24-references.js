/* js/24-references.js
   References list, "Copy all" and BibTeX download (the About tab's reference data lives here).
   Defines: refText, refBib, renderReferences, copy
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   24. REFERENCES / CITATION BLOCK
   One list drives the visible references, "copy all" and the BibTeX download.
   Authors are given as first author(s) + others where the full list was not verified.
   ============================================================ */
var REFS = [
 {g:'Data sources', k:'uniprot2025', t:'article', a:'The UniProt Consortium', ti:'UniProt: the Universal Protein Knowledgebase in 2025', j:'Nucleic Acids Research', y:'2025', v:'53', n:'D1', p:'D609–D617', doi:'10.1093/nar/gkae1010', why:'All protein records, sequences, features and cross-references'},
 {g:'Data sources', k:'jungo2012', t:'article', a:'Jungo, Florence and Bougueleret, Lydie and Xenarios, Ioannis and Poux, Sylvain', ti:'The UniProtKB/Swiss-Prot Tox-Prot program: a central hub of integrated venom protein data', j:'Toxicon', y:'2012', v:'60', n:'4', p:'551–557', doi:'10.1016/j.toxicon.2012.03.010', why:'The Tox-Prot annotation programme this dataset comes from'},
 {g:'Data sources', k:'jungo2010', t:'article', a:'Jungo, Florence and Estreicher, Anne and Bairoch, Amos and Bougueleret, Lydie and Xenarios, Ioannis', ti:'Animal toxins: how is complexity represented in databases?', j:'Toxins', y:'2010', v:'2', n:'2', p:'262–282', doi:'10.3390/toxins2020262', why:'Background on how Tox-Prot represents toxin complexity'},
 {g:'Data sources', k:'interpro2025', t:'article', a:'Blum, Matthias and Andreeva, Antonina and Florentino, Laise Cavalcanti and others', ti:'InterPro: the protein sequence classification resource in 2025', j:'Nucleic Acids Research', y:'2025', v:'53', n:'D1', p:'D444–D456', doi:'10.1093/nar/gkae1082', why:'InterPro domain and family signatures'},
 {g:'Data sources', k:'go2023', t:'article', a:'{The Gene Ontology Consortium}', ti:'The Gene Ontology knowledgebase in 2023', j:'Genetics', y:'2023', v:'224', n:'1', p:'iyad031', doi:'10.1093/genetics/iyad031', why:'Molecular-function terms behind the Mechanism of action views'},
 {g:'Data sources', k:'ashburner2000', t:'article', a:'Ashburner, Michael and Ball, Catherine A. and Blake, Judith A. and others', ti:'Gene Ontology: tool for the unification of biology', j:'Nature Genetics', y:'2000', v:'25', n:'1', p:'25–29', doi:'10.1038/75556', why:'Original Gene Ontology reference'},
 {g:'Data sources', k:'schoch2020', t:'article', a:'Schoch, Conrad L. and Ciufo, Stacy and Domrachev, Mikhail and others', ti:'NCBI Taxonomy: a comprehensive update on curation, resources and tools', j:'Database', y:'2020', v:'2020', p:'baaa062', doi:'10.1093/database/baaa062', why:'Taxonomic lineages used by the Taxonomy tab'},
 {g:'Data sources', k:'who2017', t:'misc', a:'{World Health Organization}', ti:'Guidelines for the production, control and regulation of snake antivenom immunoglobulins. Annex 5 in: WHO Expert Committee on Biological Standardization, WHO Technical Report Series, No. 1004', y:'2017', pub:'World Health Organization, Geneva', url:'https://www.who.int/publications/m/item/snake-antivenom-immunoglobulins-annex-5-trs-no-1004', why:'List of medically important venomous snakes (Tables A5.3–A5.6) behind the Clinical Importance tab'},
 {g:'Data sources', k:'wwpdb2019', t:'article', a:'{wwPDB consortium}', ti:'Protein Data Bank: the single global archive for 3D macromolecular structure data', j:'Nucleic Acids Research', y:'2019', v:'47', n:'D1', p:'D520–D528', doi:'10.1093/nar/gky949', why:'Linked PDB structures'},
 {g:'Data sources', k:'jumper2021', t:'article', a:'Jumper, John and Evans, Richard and Pritzel, Alexander and others', ti:'Highly accurate protein structure prediction with AlphaFold', j:'Nature', y:'2021', v:'596', p:'583–589', doi:'10.1038/s41586-021-03819-2', why:'Linked AlphaFold models'},
 {g:'Data sources', k:'varadi2024', t:'article', a:'Varadi, Mihaly and Bertoni, Damian and Magana, Paulyna and others', ti:'AlphaFold Protein Structure Database in 2024: providing structure coverage for over 214 million protein sequences', j:'Nucleic Acids Research', y:'2024', v:'52', n:'D1', p:'D368–D375', doi:'10.1093/nar/gkad1011', why:'Linked AlphaFold models'},
 {g:'Embedding maps', k:'elnaggar2022', t:'article', a:'Elnaggar, Ahmed and Heinzinger, Michael and Dallago, Christian and others', ti:'ProtTrans: Toward Understanding the Language of Life Through Self-Supervised Learning', j:'IEEE Transactions on Pattern Analysis and Machine Intelligence', y:'2022', v:'44', n:'10', p:'7112–7127', doi:'10.1109/TPAMI.2021.3095381', why:'ProtT5 protein language model'},
 {g:'Embedding maps', k:'heinzinger2024', t:'article', a:'Heinzinger, Michael and Weissenow, Konstantin and Sanchez, Joaquin Gomez and others', ti:'Bilingual language model for protein sequence and structure', j:'NAR Genomics and Bioinformatics', y:'2024', v:'6', n:'4', p:'lqae150', doi:'10.1093/nargab/lqae150', why:'ProstT5 structure-aware language model'},
 {g:'Embedding maps', k:'senoner2025', t:'article', a:'Senoner, Tobias and Olenyi, Tobias and Heinzinger, Michael and Spannagl, Anton and Bouras, George and Rost, Burkhard and Koludarov, Ivan', ti:'ProtSpace: A Tool for Visualizing Protein Space', j:'Journal of Molecular Biology', y:'2025', v:'437', n:'15', p:'168940', doi:'10.1016/j.jmb.2025.168940', why:'ProtSpace, whose embedding notebook generated the ProtT5 and ProstT5 embeddings'},
 {g:'Embedding maps', k:'senoner2026', t:'misc', a:'Senoner, Tobias and Vahidi, Pouya and Olenyi, Tobias and Senoner, Felix and Sisman, Gizem and Kahl, Eva and Rost, Burkhard and Koludarov, Ivan', ti:'ProtSpace: Protein Universe in Your Browser', y:'2026', pub:'bioRxiv', doi:'10.64898/2026.05.04.722720', why:'ProtSpace web application (preprint)'},
 {g:'Embedding maps', k:'wolf2020', t:'inproceedings', a:'Wolf, Thomas and Debut, Lysandre and Sanh, Victor and others', ti:'Transformers: State-of-the-Art Natural Language Processing', bt:'Proceedings of the 2020 Conference on Empirical Methods in Natural Language Processing: System Demonstrations', y:'2020', p:'38–45', pub:'Association for Computational Linguistics', doi:'10.18653/v1/2020.emnlp-demos.6', why:'Hugging Face Transformers library used to run the protein language models'},
 {g:'Embedding maps', k:'paszke2019', t:'misc', a:'Paszke, Adam and Gross, Sam and Massa, Francisco and others', ti:'PyTorch: An Imperative Style, High-Performance Deep Learning Library', y:'2019', pub:'Advances in Neural Information Processing Systems 32 (arXiv:1912.01703)', doi:'10.48550/arXiv.1912.01703', why:'Deep learning framework used to run the protein language models'},
 {g:'Embedding maps', k:'mcinnes2018joss', t:'article', a:'McInnes, Leland and Healy, John and Saul, Nathaniel and Großberger, Lukas', ti:'UMAP: Uniform Manifold Approximation and Projection', j:'Journal of Open Source Software', y:'2018', v:'3', n:'29', p:'861', doi:'10.21105/joss.00861', why:'umap-learn software used for the 2D projection'},
 {g:'Embedding maps', k:'harris2020', t:'article', a:'Harris, Charles R. and Millman, K. Jarrod and van der Walt, Stéfan J. and others', ti:'Array programming with NumPy', j:'Nature', y:'2020', v:'585', p:'357–362', doi:'10.1038/s41586-020-2649-2', why:'Array handling for the embeddings'},
 {g:'Embedding maps', k:'mcinnes2018', t:'misc', a:'McInnes, Leland and Healy, John and Melville, James', ti:'UMAP: Uniform Manifold Approximation and Projection for Dimension Reduction', y:'2018', pub:'arXiv:1802.03426', doi:'10.48550/arXiv.1802.03426', why:'2D projection of the embeddings'},
 {g:'Sequence methods', k:'smith1981', t:'article', a:'Smith, Temple F. and Waterman, Michael S.', ti:'Identification of common molecular subsequences', j:'Journal of Molecular Biology', y:'1981', v:'147', n:'1', p:'195–197', doi:'10.1016/0022-2836(81)90087-5', why:'Local alignment in Similarity Search'},
 {g:'Sequence methods', k:'gotoh1982', t:'article', a:'Gotoh, Osamu', ti:'An improved algorithm for matching biological sequences', j:'Journal of Molecular Biology', y:'1982', v:'162', n:'3', p:'705–708', doi:'10.1016/0022-2836(82)90398-9', why:'Affine gap penalties'},
 {g:'Sequence methods', k:'henikoff1992', t:'article', a:'Henikoff, Steven and Henikoff, Jorja G.', ti:'Amino acid substitution matrices from protein blocks', j:'Proceedings of the National Academy of Sciences', y:'1992', v:'89', n:'22', p:'10915–10919', doi:'10.1073/pnas.89.22.10915', why:'BLOSUM62 scoring matrix'},
 {g:'Sequence methods', k:'gasteiger2005', t:'incollection', a:'Gasteiger, Elisabeth and Hoogland, Christine and Gattiker, Alexandre and others', ti:'Protein identification and analysis tools on the ExPASy server', bt:'The Proteomics Protocols Handbook', y:'2005', p:'571–607', pub:'Humana Press', doi:'10.1385/1-59259-890-0:571', why:'ProtParam-style physicochemical properties'},
 {g:'Sequence methods', k:'bjellqvist1993', t:'article', a:'Bjellqvist, Bengt and Hughes, Graham J. and Pasquali, Christian and others', ti:'The focusing positions of polypeptides in immobilized pH gradients can be predicted from their amino acid sequences', j:'Electrophoresis', y:'1993', v:'14', n:'10', p:'1023–1031', doi:'10.1002/elps.11501401163', why:'pKa set used for pI and charge'},
 {g:'Sequence methods', k:'guruprasad1990', t:'article', a:'Guruprasad, K. and Reddy, B. V. B. and Pandit, M. W.', ti:'Correlation between stability of a protein and its dipeptide composition: a novel approach for predicting in vivo stability of a protein from its primary sequence', j:'Protein Engineering', y:'1990', v:'4', n:'2', p:'155–161', doi:'10.1093/protein/4.2.155', why:'Instability index'},
 {g:'Sequence methods', k:'kyte1982', t:'article', a:'Kyte, Jack and Doolittle, Russell F.', ti:'A simple method for displaying the hydropathic character of a protein', j:'Journal of Molecular Biology', y:'1982', v:'157', n:'1', p:'105–132', doi:'10.1016/0022-2836(82)90515-0', why:'GRAVY hydropathy'},
 {g:'Design and assets', k:'machado2009', t:'article', a:'Machado, Gustavo M. and Oliveira, Manuel M. and Fernandes, Leandro A. F.', ti:'A physiologically-based model for simulation of color vision deficiency', j:'IEEE Transactions on Visualization and Computer Graphics', y:'2009', v:'15', n:'6', p:'1291–1298', doi:'10.1109/TVCG.2009.113', why:'Colour-blind simulation used to design the colour-blind-safe palette'},
 {g:'Design and assets', k:'worldmap', t:'misc', a:'MacDonald, Al and Lekschas, Fritz', ti:'simple-world-map (continent outlines; country borders removed for this atlas)', y:'', pub:'CC BY-SA 3.0', url:'https://github.com/flekschas/simple-world-map', why:'Base map of the Clinical Importance tab. Modified: country borders removed'},
 {g:'Design and assets', k:'fonts', t:'misc', a:'{Inter (Rasmus Andersson) and IBM Plex Mono (IBM)}', ti:'Typefaces loaded from Google Fonts', y:'', pub:'SIL Open Font License 1.1', url:'https://fonts.google.com', why:'Interface fonts'}
];

function refText(r){
  var bits = [];
  var au = r.a.replace(/[{}]/g,'').replace(/ and others$/,' et al.').replace(/ and /g,'; ');
  bits.push(au+(r.y ? ' ('+r.y+').' : '.'));
  bits.push(/[?!]$/.test(r.ti) ? r.ti : r.ti+'.');
  if(r.j){ bits.push(r.j+(r.v ? ' '+r.v : '')+(r.n ? '('+r.n+')' : '')+(r.p ? ', '+r.p : '')+'.'); }
  else if(r.bt){ bits.push('In: '+r.bt+(r.pub ? '. '+r.pub : '')+(r.p ? ', pp. '+r.p : '')+'.'); }
  else if(r.pub){ bits.push(r.pub+'.'); }
  if(r.doi) bits.push('https://doi.org/'+r.doi);
  else if(r.url) bits.push(r.url);
  return bits.join(' ');
}
function refBib(r){
  var f = [['author', r.a], ['title', '{'+r.ti+'}'], ['year', r.y]];
  if(r.j) f.push(['journal', r.j]);
  if(r.bt) f.push(['booktitle', r.bt]);
  if(r.v) f.push(['volume', r.v]);
  if(r.n) f.push(['number', r.n]);
  if(r.p) f.push(['pages', r.p.replace('–','--')]);
  if(r.pub) f.push(['publisher', r.pub]);
  if(r.doi) f.push(['doi', r.doi]);
  if(r.url) f.push(['url', r.url]);
  return '@'+r.t+'{'+r.k+',\n'+f.filter(function(x){ return x[1]!==''; }).map(function(x){ return '  '+x[0]+' = {'+x[1]+'}'; }).join(',\n')+'\n}';
}
function renderReferences(){
  var host = document.getElementById('refList'); if(!host) return;
  var groups = [], by = {};
  REFS.forEach(function(r){ if(!by[r.g]){ by[r.g] = []; groups.push(r.g); } by[r.g].push(r); });
  host.innerHTML = groups.map(function(g){
    return '<div class="ref-group">'+esc(g)+'</div><ul class="ref-list">'+by[g].map(function(r){
      var link = r.doi ? 'https://doi.org/'+r.doi : r.url;
      var txt = esc(refText(r)).replace(esc(link), '<a href="'+esc(link)+'" target="_blank" rel="noopener">'+esc(link)+'</a>');
      return '<li>'+txt+'<span class="why">'+esc(r.why)+'</span></li>';
    }).join('')+'</ul>';
  }).join('');
  function copy(text, msg){
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){ toast(msg); }).catch(function(){ toast('Could not copy'); });
    } else { toast('Could not copy'); }
  }
  document.getElementById('citeCopyAtlas').addEventListener('click', function(){ copy(document.getElementById('citeAtlas').textContent, 'Citation copied'); });
  document.getElementById('citeCopyAll').addEventListener('click', function(){ copy(REFS.map(refText).join('\n\n'), 'References copied'); });
  document.getElementById('citeBib').addEventListener('click', function(){
    var atlas = '@misc{animaltoxinatlas2026,\n  author = {Lingappa, Srikanth},\n  title = {Animal Toxin Atlas: an interactive browser for UniProtKB/Swiss-Prot Tox-Prot animal toxin records},\n  year = {2026},\n  note = {Data: UniProt Tox-Prot export, retrieved September 2026}\n}';
    triggerDownload('animal-toxin-atlas-references.bib', atlas+'\n\n'+REFS.map(refBib).join('\n\n')+'\n');
  });
}

