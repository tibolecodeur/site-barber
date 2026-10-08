import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAsync } from "@/lib/useAsync";

describe("useAsync", () => {
  it("passe de loading à success", async () => {
    const { result } = renderHook(() => useAsync("a", () => Promise.resolve(42)));
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current).toMatchObject({ status: "success", data: 42 }));
  });

  it("reste idle sans clé, sans appeler le chargement", () => {
    const load = vi.fn(() => Promise.resolve(1));
    const { result } = renderHook(() => useAsync(null, load));
    expect(result.current.status).toBe("idle");
    expect(load).not.toHaveBeenCalled();
  });

  it("expose l'erreur, puis recharge avec reload()", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("réseau")).mockResolvedValueOnce("ok");
    const { result } = renderHook(() => useAsync("a", load));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current).toMatchObject({ error: new Error("réseau") });

    act(() => result.current.reload());
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current).toMatchObject({ status: "success", data: "ok" }));
  });

  it("recharge quand la clé change et ignore la réponse périmée", async () => {
    let resolveFirst: (value: string) => void = () => {};
    const first = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });
    const { result, rerender } = renderHook(
      ({ day }) => useAsync(day, () => (day === "lundi" ? first : Promise.resolve("mardi"))),
      { initialProps: { day: "lundi" } },
    );

    rerender({ day: "mardi" });
    await waitFor(() => expect(result.current).toMatchObject({ status: "success", data: "mardi" }));

    await act(async () => resolveFirst("lundi"));
    expect(result.current).toMatchObject({ data: "mardi" });
  });
});
