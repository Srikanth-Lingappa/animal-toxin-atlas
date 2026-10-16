/* js/02-load-data.js
   Decompresses the embedded dataset (gzip + base64 in <script id="app-data">) in the browser.
   Defines: b64ToBytes
   All js/ files are joined in order inside one function (see index.html), so they share variables. */
/* ============================================================
   2. LOAD + DECOMPRESS DATA
   ============================================================ */
function b64ToBytes(b64){
  var bin = atob(b64);
  var len = bin.length;
  var bytes = new Uint8Array(len);
  for(var i=0;i<len;i++){ bytes[i] = bin.charCodeAt(i); }
  return bytes;
}

async function loadData(){
  var b64 = document.getElementById('app-data').textContent.trim();
  var bytes = b64ToBytes(b64);
  if(typeof DecompressionStream === 'undefined'){
    throw new Error('DecompressionStream unsupported');
  }
  var ds = new DecompressionStream('gzip');
  var stream = new Blob([bytes]).stream().pipeThrough(ds);
  var text = await new Response(stream).text();
  return JSON.parse(text);
}
