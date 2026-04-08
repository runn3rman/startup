const SOCKET_EVENT_TYPES = {
  OPEN: 'socket/open',
  CLOSE: 'socket/close',
  ATTEMPT_SAVED: 'attempt/saved',
  RECORD_NEW: 'record/new',
};

function getSocketUrl() {
  const protocol = window.location.protocol === 'http:' ? 'ws' : 'wss';
  return `${protocol}://${window.location.host}/ws`;
}

function mapSocketEventToLegacyEvent(event) {
  if (event.type === SOCKET_EVENT_TYPES.ATTEMPT_SAVED) {
    return {
      id: event.payload.id,
      type: 'attemptFinished',
      player: event.payload.player,
      word: event.payload.word,
      timeSeconds: event.payload.timeSeconds,
      isCorrect: event.payload.isCorrect,
      createdAt: event.payload.createdAt,
      source: event.payload.source,
    };
  }

  if (event.type === SOCKET_EVENT_TYPES.RECORD_NEW) {
    return {
      id: event.payload.id,
      type: 'newRecord',
      player: event.payload.player,
      word: event.payload.word,
      timeSeconds: event.payload.timeSeconds,
      isCorrect: event.payload.isCorrect,
      createdAt: event.payload.createdAt,
      source: event.payload.source,
    };
  }

  return null;
}

export class LiveEventsClient {
  constructor() {
    this.connected = false;
    this.observers = new Set();
    this.socket = null;
    this.connect();
  }

  connect() {
    this.socket = new WebSocket(getSocketUrl());

    this.socket.onopen = () => {
      this.connected = true;
      this.notify({
        type: SOCKET_EVENT_TYPES.OPEN,
        payload: {
          connected: true,
          connectedAt: new Date().toISOString(),
        },
      });
    };

    this.socket.onmessage = async (event) => {
      const text = typeof event.data === 'string' ? event.data : await event.data.text();
      const message = JSON.parse(text);
      this.notify(message);
    };

    this.socket.onclose = () => {
      this.connected = false;
      this.notify({
        type: SOCKET_EVENT_TYPES.CLOSE,
        payload: {
          connected: false,
          disconnectedAt: new Date().toISOString(),
        },
      });
    };

    this.socket.onerror = (error) => {
      console.error('Live events socket error', error);
    };
  }

  subscribe(observer) {
    this.observers.add(observer);
    return () => {
      this.observers.delete(observer);
    };
  }

  notify(event) {
    this.observers.forEach((observer) => observer(event));
  }

  disconnect() {
    this.socket?.close();
  }
}

let liveEventsClient = null;

export function getLiveEventsClient() {
  if (!liveEventsClient) {
    liveEventsClient = new LiveEventsClient();
  }

  return liveEventsClient;
}

export function createLiveEventsClient() {
  return new LiveEventsClient();
}

export function subscribeToLiveEvents(onEvent) {
  const client = getLiveEventsClient();

  return client.subscribe((event) => {
    const mappedEvent = mapSocketEventToLegacyEvent(event);
    if (mappedEvent) {
      onEvent(mappedEvent);
    }
  });
}
