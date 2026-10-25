import { parseYamlExportFragment } from './yaml-export.mjs';
const status = document.querySelector('#status');
const download = document.querySelector('#download');
const yaml = document.querySelector('#yaml');
let current = null;
function readExport() {
  current = null;
  download.disabled = true;
  document.querySelector('#details').hidden = true;
  document.querySelector('#preview').hidden = true;
  yaml.value = '';
  const fragment = location.hash;
  try { history.replaceState(null,'',location.pathname + location.search); } catch { /* Fragment still never enters an HTTP request. */ }
  try {
    current = parseYamlExportFragment(fragment);
    document.querySelector('#slot').textContent = current.payload.slotName;
    document.querySelector('#filename').textContent = current.filename;
    document.querySelector('#details').hidden = false;
    document.querySelector('#preview').hidden = false;
    yaml.value = current.yaml;
    download.disabled = false;
    status.textContent = 'Ready. Click Download YAML to save your file.';
  } catch(error) { status.textContent = error.message; }
}
download.addEventListener('click', () => {
  if (!current) return;
  const url = URL.createObjectURL(new Blob([current.yaml],{type:'application/yaml;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = current.filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url),1000);
  status.textContent = 'Download requested. Check your browser downloads for ' + current.filename + '.';
});
document.querySelector('#select').addEventListener('click', () => { yaml.focus(); yaml.select(); });
addEventListener('hashchange',readExport);
readExport();

