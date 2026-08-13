import { useEffect, useState } from 'react';
import { Affirmation, AffirmationKind, byKind } from '@/data/content';
import { useAppStore } from '@/store/useAppStore';

type Choice = { item: Affirmation; exhausted: boolean };

/**
 * Escolha pura: sorteia sem tocar no estado global.
 * Marcar como vista é efeito colateral e acontece depois da renderização.
 */
function choose(kind: AffirmationKind, seen: string[], avoidId?: string): Choice {
  const list = byKind(kind);

  let pool = list.filter((a) => !seen.includes(a.id) && a.id !== avoidId);
  const exhausted = pool.length === 0;

  if (exhausted) pool = list.filter((a) => a.id !== avoidId);
  if (pool.length === 0) pool = list;

  return { item: pool[Math.floor(Math.random() * pool.length)], exhausted };
}

/**
 * Sorteia uma frase do tipo pedido, sem repetir as que já saíram hoje.
 * Quando o tipo esgota, só a lista daquele tipo é liberada de novo.
 */
export function useAffirmation(kind: AffirmationKind) {
  const [choice, setChoice] = useState<Choice>(() =>
    choose(kind, useAppStore.getState().seenToday)
  );

  // O registro de "já vista" roda depois do render, nunca durante
  useEffect(() => {
    const store = useAppStore.getState();
    if (choice.exhausted) store.clearSeen(byKind(kind).map((a) => a.id));
    store.markSeen(choice.item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choice]);

  const next = () =>
    setChoice((prev) => choose(kind, useAppStore.getState().seenToday, prev.item.id));

  return { current: choice.item, next };
}
