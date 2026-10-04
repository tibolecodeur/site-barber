## Ce que fait cette PR

<!-- En deux ou trois phrases, côté utilisateur : qu'est-ce qui change pour le client ou le barber ? -->

Closes #

## Comment tester

1.
2.

## Captures (si l'interface change)

| Mobile (375 px) | Desktop |
| --------------- | ------- |
|                 |         |

## Vérifications

- [ ] `npm run lint` passe
- [ ] `npm run typecheck` passe
- [ ] `npm run test:coverage` passe
- [ ] `npm run build` passe
- [ ] `npm run test:e2e` passe
- [ ] Testé à 375 px de large
- [ ] Accessibilité : labels, focus visible, navigation au clavier, contrastes AA
- [ ] Migration SQL versionnée + tests pgTAP si le schéma change
- [ ] Agent `relecteur-securite` passé si les données ou l'auth changent
- [ ] `docs/PLAN.md`, README, CHANGELOG et ADR mis à jour si nécessaire
