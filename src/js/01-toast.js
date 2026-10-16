/* js/01-toast.js
   Small pop-up messages ("Copied", "Downloaded").
   Defines: toast
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   1. TOAST
   ============================================================ */
var toastEl = null;
function toast(msg){
  if(!toastEl){
    toastEl = document.createElement('div');
    toastEl.style.cssText = 'position:fixed;bottom:22px;left:50%;transform:translateX(-50%);'+
      'background:var(--bg-elev-2);border:1px solid var(--line-strong);color:var(--ink);'+
      'padding:10px 18px;border-radius:20px;font-size:12.5px;z-index:200;box-shadow:var(--shadow);'+
      'opacity:0;transition:opacity .18s;pointer-events:none;font-family:var(--font-mono);';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.style.opacity = '1';
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(function(){ toastEl.style.opacity = '0'; }, 2600);
}
