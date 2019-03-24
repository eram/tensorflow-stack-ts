import "jest";

class LocalStorageMock {
  store = new Map<string, {}>();
  setItem = jest.fn((key: string, val: {}) => this.store.set(key, val));
  getItem = jest.fn((key: string) => this.store.get(key));
  removeItem = jest.fn((key: string) => this.store.delete(key));
  clear = jest.fn(() => this.store.clear());
}

Object.assign(window, { localStorage: new LocalStorageMock() });
module.exports = window.localStorage;
