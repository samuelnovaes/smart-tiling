type Handler = (...args: never[]) => unknown;

export default class Signals {
  private handlers = new Map<number, [string, Handler]>();

  private nextId = 1;

  connect(signal: string, handler: Handler) {
    const id = this.nextId++;
    this.handlers.set(id, [signal, handler]);
    return id;
  }

  disconnect(id: number) {
    this.handlers.delete(id);
  }

  emit(signal: string, ...args: unknown[]) {
    let result: unknown;
    for (const [name, handler] of [...this.handlers.values()]) {
      if (name === signal) {
        result = (handler as (...args: unknown[]) => unknown)(this, ...args);
      }
    }
    return result;
  }

  handlerCount(signal?: string) {
    return [...this.handlers.values()].filter(([name]) => signal === undefined || name === signal).length;
  }
}
