import '@testing-library/jest-dom';

// Node 22+ ships an experimental global localStorage that requires --localstorage-file
// and otherwise collides with jsdom's stub, causing TypeError: Cannot read properties
// of undefined (reading 'getItem'). Define a clean in-memory shim before jsdom sees it.
Object.defineProperty(globalThis, 'localStorage', {
	value: (() => {
		const store = new Map();
		return {
			getItem: (k) => (store.has(k) ? store.get(k) : null),
			setItem: (k, v) => store.set(k, String(v)),
			removeItem: (k) => store.delete(k),
			clear: () => store.clear(),
			key: (i) => Array.from(store.keys())[i] ?? null,
			get length() { return store.size; },
		};
	})(),
	writable: true,
	configurable: true,
});

// jsdom doesn't implement window.matchMedia. Shim a no-op so components that
// read prefers-color-scheme don't throw during render.
Object.defineProperty(window, 'matchMedia', {
	value: (query) => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener: () => {},
		removeEventListener: () => {},
		addListener: () => {},
		removeListener: () => {},
		dispatchEvent: () => false,
	}),
	writable: true,
	configurable: true,
});
