import { useEffect, useEffectEvent, useState } from "react";

export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "success"; data: T };

export type AsyncResult<T> = AsyncState<T> & { reload: () => void };

type Settled<T> = { key: string; state: AsyncState<T> };

/**
 * Charge une donnée asynchrone (appel à la couche data) et expose son état :
 * idle → loading → success | error, plus `reload()` pour réessayer.
 *
 * `key` identifie la requête (ex. "slots|<service>|2026-10-13") : quand elle change, on
 * recharge. `null` = rien à charger (état idle). C'est l'équivalent d'un tableau de
 * dépendances, sous forme de chaîne simple à comparer.
 *
 * Deux détails React :
 * - le résultat est mémorisé AVEC la clé qui l'a produit. Si la clé courante est différente,
 *   on est en train de charger : pas besoin de remettre l'état à « loading » dans l'effet
 *   (un setState synchrone dans un effet provoque un rendu inutile) ;
 * - `useEffectEvent` donne à l'effet la DERNIÈRE version de `load` sans en faire une
 *   dépendance : seul un changement de clé relance le chargement.
 * Une réponse arrivée après un changement de clé est ignorée (`active`), comme on
 * ignorerait la réponse d'une requête périmée.
 */
export function useAsync<T>(key: string | null, load: () => Promise<T>): AsyncResult<T> {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const requestKey = key === null ? null : `${key}#${attempt}`;
  const runLoad = useEffectEvent(load);

  useEffect(() => {
    if (requestKey === null) return;
    let active = true;
    runLoad().then(
      (data) => {
        if (active) setSettled({ key: requestKey, state: { status: "success", data } });
      },
      (error: unknown) => {
        if (active) setSettled({ key: requestKey, state: { status: "error", error } });
      },
    );
    return () => {
      active = false;
    };
  }, [requestKey]);

  const reload = () => setAttempt((n) => n + 1);
  if (requestKey === null) return { status: "idle", reload };
  if (settled?.key !== requestKey) return { status: "loading", reload };
  return { ...settled.state, reload };
}
