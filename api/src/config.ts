export function getPort(): number {
  const portStr = process.env.WEB_SERVER_PORT;
  if (portStr === undefined)
    throw new Error("Port is required");
  const port = parseInt(portStr);
  if (isNaN(port) || port <= 0 || port > 65535)
    throw new Error(`Invalid web server port (expected: 0 <= port < 65535, given: ${port})`);
  return port;
}
