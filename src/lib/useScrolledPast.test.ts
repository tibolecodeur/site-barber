import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useScrolledPast } from "@/lib/useScrolledPast";

/** jsdom ne fait pas défiler : on fixe `scrollY` à la main puis on émet l'événement. */
function scrollTo(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
  window.dispatchEvent(new Event("scroll"));
}

afterEach(() => {
  Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
});

describe("useScrolledPast", () => {
  it("renvoie false tant que le seuil n'est pas dépassé, true au-delà", () => {
    const { result } = renderHook(() => useScrolledPast(() => 100));
    expect(result.current).toBe(false);

    act(() => scrollTo(100));
    expect(result.current).toBe(false);

    act(() => scrollTo(101));
    expect(result.current).toBe(true);

    act(() => scrollTo(0));
    expect(result.current).toBe(false);
  });

  it("relit le seuil au redimensionnement de la fenêtre", () => {
    let threshold = 500;
    const { result } = renderHook(() => useScrolledPast(() => threshold));
    act(() => scrollTo(300));
    expect(result.current).toBe(false);

    threshold = 200;
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe(true);
  });
});
