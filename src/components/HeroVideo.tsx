import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

type HeroVideoProps = {
  /** Vidéo en boucle (MP4 H.264, 720p vertical, ≤ 6 s, ~1,5 Mo), dans public/media/. */
  videoSrc?: string;
  /** Image fixe affichée avant la vidéo, ou à sa place (animations réduites, lecture refusée). */
  posterSrc?: string;
};

/**
 * Fond du hero : média en noir et blanc, teinte duotone rose → orange, puis voile sombre.
 * Purement décoratif (`aria-hidden`) : le texte du hero porte toute l'information.
 *
 * Contraste garanti du texte blanc, même si l'image est entièrement blanche : le voile #111111
 * à 60 % ramène le blanc à une luminance de 0,16, soit 4,95 contre du blanc (AA : 4,5).
 *
 * Pas de vidéo du tout (donc rien de téléchargé) si l'utilisateur réduit les animations ou si
 * le navigateur refuse la lecture automatique (mode économie d'énergie d'iOS) : poster seul.
 */
export function HeroVideo({ videoSrc, posterSrc }: HeroVideoProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  // On mémorise QUELLE source a échoué plutôt qu'un simple booléen : si la source change,
  // la nouvelle vidéo est retentée sans effet de « remise à zéro ».
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showVideo = videoSrc !== undefined && !prefersReducedMotion && failedSrc !== videoSrc;

  useEffect(() => {
    const video = videoRef.current;
    if (!showVideo || !video || videoSrc === undefined) return;
    // `autoplay` seul échoue en silence sur iOS en économie d'énergie. `play()` renvoie une
    // promesse, rejetée dans ce cas : on bascule alors sur le poster.
    video.play()?.catch(() => setFailedSrc(videoSrc));
  }, [showVideo, videoSrc]);

  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10" data-testid="hero-media">
      <div className="absolute inset-0 grayscale">
        {posterSrc ? (
          // Visible dès l'arrivée : surtout pas de loading="lazy", et priorité haute.
          <img src={posterSrc} alt="" fetchPriority="high" className="size-full object-cover" />
        ) : (
          // TODO média : fond provisoire tant que la vidéo et son poster ne sont pas fournis.
          <div className="size-full bg-ink" />
        )}
        {showVideo && (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={posterSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            disablePictureInPicture
            onError={() => setFailedSrc(videoSrc)}
            className="absolute inset-0 size-full object-cover"
          />
        )}
      </div>
      {/* Duotone FIXE (jamais animé) : le noir reste noir, le blanc devient rose → orange. */}
      <div className="absolute inset-0 bg-linear-to-br from-accent to-action mix-blend-multiply" />
      <div className="absolute inset-0 bg-ink/60" />
    </div>
  );
}
