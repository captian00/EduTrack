type Listener = () => void;

let pendingRequests = 0;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function beginApiRequest() {
  pendingRequests += 1;
  emit();
}

export function endApiRequest() {
  pendingRequests = Math.max(0, pendingRequests - 1);
  emit();
}

export function subscribeApiLoading(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getApiLoadingSnapshot() {
  return pendingRequests > 0;
}

export function getApiLoadingServerSnapshot() {
  return false;
}
