export const WORLD = { game: 'Twichipelago', schema: 3, cheerId: 2026102302, locationBase: 2026102400, minChecks: 3, maxChecks: 500, defaultChecks: 10 };
export function validateReleaseCounts(checks, progressionItems = 0, trapItems = 0) {
  if (!Number.isInteger(checks) || checks < WORLD.minChecks || checks > WORLD.maxChecks) throw new Error('Choose between 3 and 500 audience checks.');
  if (![progressionItems, trapItems].every(value => Number.isInteger(value) && value >= 0 && value <= WORLD.maxChecks)) throw new Error('Progression and trap counts must be whole numbers from 0 to 500.');
  if (progressionItems + trapItems > checks) throw new Error('Progression and trap counts together cannot exceed the number of audience checks.');
  return { progression: progressionItems, traps: trapItems, normal: checks - progressionItems - trapItems };
}
export function playerYaml(name, checks = WORLD.defaultChecks, progressionItems = 0, trapItems = 0, runtimeSettings) {
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 16 || /[\x00-\x1f{}%]/.test(name)) throw new Error('Use an audience slot name of 1–16 characters without control characters, braces, or percent signs.');
  validateReleaseCounts(checks, progressionItems, trapItems);
  if (checks > 50 || progressionItems > 50 || trapItems > 50) throw new Error("Starting counts must be at most 50; generation can grow total checks up to 500.");
  const runtimeLine = runtimeSettings ? `  runtime_settings: ${JSON.stringify(validateRuntimeSettings(runtimeSettings))}\n` : '';
  return `# Requires twichipelago.apworld 0.0.9 or newer on the host generator.\n# Total checks are a starting target and may grow up to 500 for non-local items. Unavailable traps become normal checks; positive progression counts may increase for non-local items; zero stays off.\nname: ${JSON.stringify(name.trim())}\ngame: Twichipelago\nrequires:\n  version: 0.6.8\n  game:\n    Twichipelago: 0.0.9\nTwichipelago:\n  progression_balancing: 50\n  accessibility: full\n  audience_checks: ${checks}\n  progression_items: ${progressionItems}\n  trap_items: ${trapItems}\n${runtimeLine}`;
}

export function playerYamlFilename(name) {
  let filename = name.trim().replace(/\s+/g, '-').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/[. ]+$/g, '');
  if (!filename) filename = 'audience';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(filename)) filename = '_' + filename;
  return `${filename}.yaml`;
}

export function validateRuntimeSettings(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![1,2].includes(value.version) || Object.keys(value).sort().join() !== ['version','broadcaster_id','client_id','costs','allow_progression',...(value.version === 2 ? ['reward_enabled'] : [])].sort().join()) throw new Error('Invalid broadcaster settings.');
  if (typeof value.broadcaster_id !== 'string' || !/^[0-9]{1,30}$/.test(value.broadcaster_id)) throw new Error('Wait for Twitch to identify your broadcaster account.');
  if (typeof value.client_id !== 'string' || !/^[a-zA-Z0-9]{10,64}$/.test(value.client_id)) throw new Error('Enter your public Twitch application Client ID.');
  if (!value.costs || Object.keys(value.costs).sort().join() !== ['normal','progression','trap'].sort().join() || !Object.values(value.costs).every(n => Number.isInteger(n) && n >= 1 && n <= 1000000000)) throw new Error('Each Channel Point cost must be a whole number from 1 to 1,000,000,000.');
  if (typeof value.allow_progression !== 'boolean') throw new Error('Choose whether to allow progression rewards.');
  if (value.version === 2 && (!value.reward_enabled || Object.keys(value.reward_enabled).sort().join() !== ['normal','progression','trap'].sort().join() || !Object.values(value.reward_enabled).every(n => typeof n === 'boolean'))) throw new Error('Choose which rewards to enable.');
  return {...(value.version === 2 ? {reward_enabled:{...value.reward_enabled}} : {}),version:value.version,broadcaster_id:value.broadcaster_id,client_id:value.client_id,costs:{...value.costs},allow_progression:value.allow_progression};
}
