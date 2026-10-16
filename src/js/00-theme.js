/* js/00-theme.js
   Light/dark theme and the colour-blind-safe palette switch: reads the saved choice and applies it.
   Defines: setCvd
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   0. THEME
   ============================================================ */
(function initTheme(){
  var saved = null;
  try{ saved = localStorage.getItem('va_theme'); }catch(e){}
  if(saved === 'dark' || saved === 'light'){
    document.documentElement.setAttribute('data-theme', saved);
  }
  document.getElementById('themeBtn').addEventListener('click', function(){
    var cur = document.documentElement.getAttribute('data-theme');
    var mql = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if(!cur) cur = mql ? 'dark' : 'light';
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try{ localStorage.setItem('va_theme', next); }catch(e){}
  });
  var cvdBtn = document.getElementById('cvdBtn');
  function setCvd(on){
    if(on) document.documentElement.setAttribute('data-cvd','1'); else document.documentElement.removeAttribute('data-cvd');
    cvdBtn.classList.toggle('on', on); cvdBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    try{ localStorage.setItem('va_cvd', on ? '1' : '0'); }catch(e){}
  }
  var savedCvd = null; try{ savedCvd = localStorage.getItem('va_cvd'); }catch(e){}
  if(savedCvd === '1'){ document.documentElement.setAttribute('data-cvd','1'); cvdBtn.classList.add('on'); cvdBtn.setAttribute('aria-pressed','true'); }
  cvdBtn.addEventListener('click', function(){ setCvd(document.documentElement.getAttribute('data-cvd') !== '1'); });
})();
