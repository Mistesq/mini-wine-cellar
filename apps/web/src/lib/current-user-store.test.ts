type Store = typeof import("./current-user-store");

const STORAGE_KEY = "mini-wine-cellar:user-id";

type FakeStorage = {
  getItem: jest.Mock<string | null, [string]>;
  setItem: jest.Mock<void, [string, string]>;
};

function installWindow(localStorage: FakeStorage | (() => never)) {
  const storageListeners: ((event: { key: string | null }) => void)[] = [];
  const fakeWindow = {
    addEventListener: (
      _type: string,
      listener: (event: { key: string | null }) => void,
    ) => storageListeners.push(listener),
    removeEventListener: jest.fn(),
  };
  Object.defineProperty(fakeWindow, "localStorage", {
    get: typeof localStorage === "function" ? localStorage : () => localStorage,
  });
  Object.defineProperty(globalThis, "window", {
    value: fakeWindow,
    configurable: true,
  });
  return {
    fireStorage: (key: string | null) => {
      for (const listener of storageListeners) {
        listener({ key });
      }
    },
  };
}

function memoryStorage(): FakeStorage {
  const values = new Map<string, string>();
  return {
    getItem: jest.fn((key: string) => values.get(key) ?? null),
    setItem: jest.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  };
}

// Fresh module per test: the store keeps listeners and the fallback in module scope.
async function loadStore(): Promise<Store> {
  let store: Store | undefined;
  await jest.isolateModulesAsync(async () => {
    store = await import("./current-user-store");
  });
  if (!store) {
    throw new Error("store did not load");
  }
  return store;
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
});

describe("current user store", () => {
  it("returns null without a window (server render)", async () => {
    const store = await loadStore();
    expect(store.getCurrentUserId()).toBeNull();
  });

  it("stores the id and notifies subscribers once per change", async () => {
    const storage = memoryStorage();
    installWindow(storage);
    const store = await loadStore();
    const listener = jest.fn();
    store.subscribeToCurrentUser(listener);

    store.setCurrentUserId("user-1");
    store.setCurrentUserId("user-1");

    expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEY, "user-1");
    expect(store.getCurrentUserId()).toBe("user-1");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("returns null when reading storage throws", async () => {
    installWindow(() => {
      throw new Error("SecurityError");
    });
    const store = await loadStore();
    expect(store.getCurrentUserId()).toBeNull();
  });

  it("keeps the id in memory when the write fails", async () => {
    const storage = memoryStorage();
    storage.setItem.mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    installWindow(storage);
    const store = await loadStore();
    const listener = jest.fn();
    store.subscribeToCurrentUser(listener);

    store.setCurrentUserId("user-2");

    expect(store.getCurrentUserId()).toBe("user-2");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("notifies on storage events for its key and on clear()", async () => {
    const { fireStorage } = installWindow(memoryStorage());
    const store = await loadStore();
    const listener = jest.fn();
    store.subscribeToCurrentUser(listener);

    fireStorage(STORAGE_KEY);
    fireStorage(null);
    fireStorage("another-key");

    expect(listener).toHaveBeenCalledTimes(2);
  });
});
