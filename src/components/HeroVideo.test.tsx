import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroVideo } from "@/components/HeroVideo";

/** Fausse media query `prefers-reduced-motion` (jsdom n'a pas de matchMedia). */
function setReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: reduce,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
}

const play = vi.spyOn(HTMLMediaElement.prototype, "play");

function getVideo() {
  return screen.getByTestId("hero-media").querySelector("video");
}

beforeEach(() => {
  play.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HeroVideo", () => {
  it("lit la vidéo en boucle, muette, en ligne, sans précharger tout le fichier", () => {
    setReducedMotion(false);
    render(<HeroVideo videoSrc="/media/hero.mp4" posterSrc="/media/hero.jpg" />);

    const video = getVideo();
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute("src", "/media/hero.mp4");
    expect(video).toHaveAttribute("poster", "/media/hero.jpg");
    expect(video).toHaveAttribute("loop");
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("preload", "metadata");
    // React pose `muted` comme propriété DOM, pas comme attribut HTML.
    expect(video!.muted).toBe(true);
    expect(play).toHaveBeenCalledOnce();
  });

  it("n'affiche pas de vidéo si l'utilisateur réduit les animations : poster seul", () => {
    setReducedMotion(true);
    render(<HeroVideo videoSrc="/media/hero.mp4" posterSrc="/media/hero.jpg" />);

    expect(getVideo()).toBeNull();
    expect(play).not.toHaveBeenCalled();
    const poster = screen.getByTestId("hero-media").querySelector("img");
    expect(poster).toHaveAttribute("src", "/media/hero.jpg");
    expect(poster).not.toHaveAttribute("loading");
  });

  it("retire la vidéo si la lecture automatique est refusée (économie d'énergie iOS)", async () => {
    setReducedMotion(false);
    play.mockRejectedValue(new DOMException("refusé", "NotAllowedError"));
    render(<HeroVideo videoSrc="/media/hero.mp4" posterSrc="/media/hero.jpg" />);

    await vi.waitFor(() => expect(getVideo()).toBeNull());
    expect(screen.getByTestId("hero-media").querySelector("img")).not.toBeNull();
  });

  it("affiche un fond provisoire sans vidéo ni poster", () => {
    setReducedMotion(false);
    render(<HeroVideo />);

    const media = screen.getByTestId("hero-media");
    expect(media.querySelector("video")).toBeNull();
    expect(media.querySelector("img")).toBeNull();
    expect(media).toHaveAttribute("aria-hidden", "true");
  });
});
