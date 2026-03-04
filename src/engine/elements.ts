import type { ElementType } from '@/types/cards';

/** Infuse an element (add to available set) */
export function infuseElement(current: Set<ElementType>, element: ElementType): Set<ElementType> {
  const updated = new Set(current);
  updated.add(element);
  return updated;
}

/** Consume an element if available */
export function consumeElement(
  current: Set<ElementType>,
  element: ElementType,
): { success: boolean; updated: Set<ElementType> } {
  if (!current.has(element)) {
    return { success: false, updated: current };
  }
  const updated = new Set(current);
  updated.delete(element);
  return { success: true, updated };
}

/** Check if an element is available for consumption */
export function canConsume(current: Set<ElementType>, element: ElementType): boolean {
  return current.has(element);
}
