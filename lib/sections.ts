/**
 * Which of a page's sections is in view: the lowest one whose top has passed the line (the upper third of the
 * screen), or null above the first. The order of the list does not matter, only where each section sits.
 */
export function sectionInView(tops: { id: string; top: number }[], line: number): string | null {
  let found: { id: string; top: number } | null = null;
  for (const section of tops) {
    if (section.top <= line && (!found || section.top > found.top)) found = section;
  }
  return found ? found.id : null;
}
