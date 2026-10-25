import { playerYaml, playerYamlFilename, validateRuntimeSettings } from './world-data.mjs';

export function validateYamlExport(value) {
  const keys = ['version','slotName','checks','progressionItems','trapItems','runtimeSettings'];
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join() !== keys.sort().join() || value.version !== 1) throw new Error('This export link is invalid. Generate a fresh link in the Twitch Extension.');
  const runtimeSettings = validateRuntimeSettings(value.runtimeSettings);
  const payload = {version:1,slotName:value.slotName,checks:value.checks,progressionItems:value.progressionItems,trapItems:value.trapItems,runtimeSettings};
  const yaml = playerYaml(payload.slotName,payload.checks,payload.progressionItems,payload.trapItems,runtimeSettings);
  return {payload,yaml,filename:playerYamlFilename(payload.slotName)};
}
export function createYamlExportUrl(base, value) {
  const target = new URL(base);
  if (target.protocol !== 'https:' || target.username || target.password || target.search || target.hash) throw new Error('The YAML download page must use a public HTTPS URL without credentials, a query or a fragment.');
  const {payload} = validateYamlExport(value);
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const encoded = btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  target.hash = 'v1=' + encoded;
  return target.href;
}
export function parseYamlExportFragment(fragment) {
  if (typeof fragment !== 'string' || fragment.length > 8192 || !/^#v1=[A-Za-z0-9_-]+$/.test(fragment)) throw new Error('Open this page using Download player YAML in the Twitch Extension.');
  try {
    let encoded = fragment.slice(4).replace(/-/g,'+').replace(/_/g,'/');
    encoded = encoded.padEnd(Math.ceil(encoded.length/4)*4,'=');
    const decoded = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
    const value = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(decoded));
    return validateYamlExport(value);
  } catch {
    throw new Error('This YAML export link is invalid or outdated. Generate a fresh link in the Twitch Extension.');
  }
}
