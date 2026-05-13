export function openEventStream(url, handlers = {}) {
  if (typeof window === "undefined" || !url) {
    return () => {};
  }

  const source = new EventSource(url);

  if (handlers.message) {
    source.onmessage = (event) => {
      handlers.message(JSON.parse(event.data));
    };
  }

  Object.entries(handlers.events || {}).forEach(([eventName, handler]) => {
    source.addEventListener(eventName, (event) => {
      handler(JSON.parse(event.data));
    });
  });

  source.onerror = (event) => {
    handlers.error?.(event);
  };

  return () => source.close();
}
