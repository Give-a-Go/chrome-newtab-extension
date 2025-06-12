// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock localStorage
let store = {};
const localStorageMock = {
  getItem: jest.fn((key) => store[key] || null),
  setItem: jest.fn((key, value) => {
    store[key] = value.toString();
  }),
  removeItem: jest.fn((key) => {
    delete store[key];
  }),
  clear: jest.fn(() => {
    store = {};
  }),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.matchMedia for Chakra UI
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock chrome extension APIs
if (typeof global.chrome === 'undefined') {
  global.chrome = {
    identity: {
      getRedirectURL: jest.fn(() => 'http://localhost:3000/mock_redirect'),
    },
    runtime: {
      sendMessage: jest.fn(),
      lastError: null,
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn()
      }
      // ... other runtime properties/methods if needed
    },
    // ... other chrome APIs if needed by other components
  };
} else {
  global.chrome.identity = { ...global.chrome.identity, getRedirectURL: jest.fn(() => 'http://localhost:3000/mock_redirect') };
   if(!global.chrome.runtime){
    global.chrome.runtime = {
        sendMessage: jest.fn(),
        lastError: null,
        onMessage: {
            addListener: jest.fn(),
            removeListener: jest.fn()
        }
    }
   }
}

// Reset mocks before each test
beforeEach(() => {
  store = {}; // Clear the store directly
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear(); // Clear the jest.fn() mock itself

  if (global.chrome && global.chrome.identity && global.chrome.identity.getRedirectURL) {
    global.chrome.identity.getRedirectURL.mockClear();
  }
   if (global.chrome && global.chrome.runtime && global.chrome.runtime.sendMessage) {
    global.chrome.runtime.sendMessage.mockClear();
  }
  // if axios is globally mocked (e.g. jest.mock('axios')), clear its mocks too
  // However, specific axios mocks are usually handled per test suite or test.
});
