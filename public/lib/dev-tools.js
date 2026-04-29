const DEV_TOOLS_KEY = 'planium-dev-tools-enabled';

export function isDevToolsEnabled() {
  return localStorage.getItem(DEV_TOOLS_KEY) === 'true';
}

export function setDevToolsEnabled(enabled) {
  localStorage.setItem(DEV_TOOLS_KEY, enabled ? 'true' : 'false');
}
