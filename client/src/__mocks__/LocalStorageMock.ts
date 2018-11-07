import "jest";

class LocalStorageMock {
  store = {};
  setItem = jest.fn((key: string, val: {}) => Object.assign(this.store, { [key]: val }));
  getItem = jest.fn((key: string) => this.store[key]);
  clear = jest.fn(() => this.store = {});
}

Object.assign(window, { localStorage: new LocalStorageMock() });
module.exports = window.localStorage;
