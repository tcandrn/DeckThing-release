export function getBackendUrl() {
  const { protocol, hostname, port } = window.location;
  const targetPort = port === '5173' ? '3001' : (port || '3001');
  return `${protocol}//${hostname}:${targetPort}`;
}
