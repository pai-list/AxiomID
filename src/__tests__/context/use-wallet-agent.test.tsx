import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useWalletAgent } from "@/app/context/use-wallet-agent";
import { makeUser } from "@/test-helpers/wallet-test-helpers";

const getMockToken = (prefix: string) => `${prefix}-${Math.random().toString(36).substring(2)}`;

describe("useWalletAgent — createAgent", () => {
  let mockFetch: jest.Mock;
  let mockRefreshUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    mockRefreshUser = jest.fn().mockResolvedValue(undefined);
  });

  it("returns false when userRef.current is null", async () => {
    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: null,
        userRef: { current: null },
        refreshUser: mockRefreshUser,
      })
    );

    let res: boolean | undefined;
    await act(async () => {
      res = await result.current.createAgent("TestAgent");
    });

    expect(res).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockRefreshUser).not.toHaveBeenCalled();
  });

  it("calls /api/agent POST with name in body and returns true on success", async () => {
    const userRef = { current: makeUser() };
    const token = getMockToken("agent");
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: token,
        userRef,
        refreshUser: mockRefreshUser,
      })
    );

    let res: boolean | undefined;
    await act(async () => {
      res = await result.current.createAgent("MyAgent");
    });

    expect(res).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith("/api/agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: "MyAgent" }),
    });
    expect(mockRefreshUser).toHaveBeenCalledTimes(1);
  });

  it("calls /api/agent POST without body when name is not provided", async () => {
    const userRef = { current: makeUser() };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: null,
        userRef,
        refreshUser: mockRefreshUser,
      })
    );

    await act(async () => {
      await result.current.createAgent();
    });

    const call = mockFetch.mock.calls[0];
    expect(call[1].body).toBeUndefined();
  });

  it("returns false when API returns non-ok", async () => {
    const userRef = { current: makeUser() };
    mockFetch.mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: null,
        userRef,
        refreshUser: mockRefreshUser,
      })
    );

    let res: boolean | undefined;
    await act(async () => {
      res = await result.current.createAgent("Fail");
    });

    expect(res).toBe(false);
    expect(mockRefreshUser).not.toHaveBeenCalled();
  });

  it("returns false on network error", async () => {
    const userRef = { current: makeUser() };
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: null,
        userRef,
        refreshUser: mockRefreshUser,
      })
    );

    let res: boolean | undefined;
    await act(async () => {
      res = await result.current.createAgent();
    });

    expect(res).toBe(false);
  });

  it("does not include Authorization header when piAccessToken is null", async () => {
    const userRef = { current: makeUser() };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: null,
        userRef,
        refreshUser: mockRefreshUser,
      })
    );

    await act(async () => {
      await result.current.createAgent("NoAuth");
    });

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers["Authorization"]).toBeUndefined();
    expect(headers["Content-Type"]).toBe("application/json");
  });
});

describe("useWalletAgent — activateAgent", () => {
  let mockFetch: jest.Mock;
  let mockRefreshUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    mockRefreshUser = jest.fn().mockResolvedValue(undefined);
  });

  it("returns false when userRef.current is null", async () => {
    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: null,
        userRef: { current: null },
        refreshUser: mockRefreshUser,
      })
    );

    let res: boolean | undefined;
    await act(async () => {
      res = await result.current.activateAgent();
    });

    expect(res).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls /api/agent/activate POST and returns true on success", async () => {
    const userRef = { current: makeUser() };
    const token = getMockToken("activate");
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: token,
        userRef,
        refreshUser: mockRefreshUser,
      })
    );

    let res: boolean | undefined;
    await act(async () => {
      res = await result.current.activateAgent();
    });

    expect(res).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith("/api/agent/activate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    expect(mockRefreshUser).toHaveBeenCalledTimes(1);
  });

  it("sends no body in the activate request", async () => {
    const userRef = { current: makeUser() };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: null,
        userRef,
        refreshUser: mockRefreshUser,
      })
    );

    await act(async () => {
      await result.current.activateAgent();
    });

    const callOptions = mockFetch.mock.calls[0][1];
    expect(callOptions.body).toBeUndefined();
  });

  it("returns false when API returns non-ok", async () => {
    const userRef = { current: makeUser() };
    mockFetch.mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: null,
        userRef,
        refreshUser: mockRefreshUser,
      })
    );

    let res: boolean | undefined;
    await act(async () => {
      res = await result.current.activateAgent();
    });

    expect(res).toBe(false);
    expect(mockRefreshUser).not.toHaveBeenCalled();
  });

  it("returns false on network error", async () => {
    const userRef = { current: makeUser() };
    mockFetch.mockRejectedValueOnce(new Error("Connection refused"));

    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: null,
        userRef,
        refreshUser: mockRefreshUser,
      })
    );

    let res: boolean | undefined;
    await act(async () => {
      res = await result.current.activateAgent();
    });

    expect(res).toBe(false);
  });
});

describe("useWalletAgent — pauseAgent", () => {
  let mockFetch: jest.Mock;
  let mockRefreshUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    mockRefreshUser = jest.fn().mockResolvedValue(undefined);
  });

  it("returns false when userRef.current is null", async () => {
    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: null,
        userRef: { current: null },
        refreshUser: mockRefreshUser,
      })
    );

    let res: boolean | undefined;
    await act(async () => {
      res = await result.current.pauseAgent();
    });

    expect(res).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls /api/agent/pause POST and returns true on success", async () => {
    const userRef = { current: makeUser() };
    const token = getMockToken("pause");
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: token,
        userRef,
        refreshUser: mockRefreshUser,
      })
    );

    let res: boolean | undefined;
    await act(async () => {
      res = await result.current.pauseAgent();
    });

    expect(res).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith("/api/agent/pause", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    expect(mockRefreshUser).toHaveBeenCalledTimes(1);
  });

  it("sends no body in the pause request", async () => {
    const userRef = { current: makeUser() };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: null,
        userRef,
        refreshUser: mockRefreshUser,
      })
    );

    await act(async () => {
      await result.current.pauseAgent();
    });

    const callOptions = mockFetch.mock.calls[0][1];
    expect(callOptions.body).toBeUndefined();
  });

  it("returns false when API returns non-ok", async () => {
    const userRef = { current: makeUser() };
    mockFetch.mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: null,
        userRef,
        refreshUser: mockRefreshUser,
      })
    );

    let res: boolean | undefined;
    await act(async () => {
      res = await result.current.pauseAgent();
    });

    expect(res).toBe(false);
    expect(mockRefreshUser).not.toHaveBeenCalled();
  });

  it("returns false on network error", async () => {
    const userRef = { current: makeUser() };
    mockFetch.mockRejectedValueOnce(new Error("Network gone"));

    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: null,
        userRef,
        refreshUser: mockRefreshUser,
      })
    );

    let res: boolean | undefined;
    await act(async () => {
      res = await result.current.pauseAgent();
    });

    expect(res).toBe(false);
  });
});

describe("useWalletAgent — authHeaders helper", () => {
  let mockFetch: jest.Mock;
  let mockRefreshUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    mockRefreshUser = jest.fn().mockResolvedValue(undefined);
  });

  it("includes Authorization header when piAccessToken is provided for pauseAgent", async () => {
    const userRef = { current: makeUser() };
    const token = getMockToken("pause-auth");
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: token,
        userRef,
        refreshUser: mockRefreshUser,
      })
    );

    await act(async () => {
      await result.current.pauseAgent();
    });

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers["Authorization"]).toBe(`Bearer ${token}`);
  });

  it("does not include Authorization header when piAccessToken is null for activateAgent", async () => {
    const userRef = { current: makeUser() };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: null,
        userRef,
        refreshUser: mockRefreshUser,
      })
    );

    await act(async () => {
      await result.current.activateAgent();
    });

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers["Authorization"]).toBeUndefined();
  });

  it("calls refreshUser after successful pauseAgent", async () => {
    const userRef = { current: makeUser() };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: null,
        userRef,
        refreshUser: mockRefreshUser,
      })
    );

    await act(async () => {
      await result.current.pauseAgent();
    });

    expect(mockRefreshUser).toHaveBeenCalledTimes(1);
  });

  it("calls refreshUser after successful createAgent", async () => {
    const userRef = { current: makeUser() };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: null,
        userRef,
        refreshUser: mockRefreshUser,
      })
    );

    await act(async () => {
      await result.current.createAgent("TestAgent");
    });

    expect(mockRefreshUser).toHaveBeenCalledTimes(1);
  });

  it("does NOT call refreshUser when createAgent fails", async () => {
    const userRef = { current: makeUser() };
    mockFetch.mockRejectedValueOnce(new Error("Fetch failed"));

    const { result } = renderHook(() =>
      useWalletAgent({
        piAccessToken: null,
        userRef,
        refreshUser: mockRefreshUser,
      })
    );

    await act(async () => {
      await result.current.createAgent("FailAgent");
    });

    expect(mockRefreshUser).not.toHaveBeenCalled();
  });
});