import type { ArchiveStoryCaseConfig, MainStoryCaseConfig } from '../data/casePrototypes';
import { archiveRegionLabel } from '../data/archiveBoardRules';
import { PuzzleSession } from '../core/PuzzleSession';
import { PuzzleHint } from '../core/PuzzleTypes';

/** Prefer the currently revealed stage rather than exposing a later story beat. */
function currentTarget(session: PuzzleSession): string | undefined {
  const snapshot = session.snapshot(), definition = session.definition;
  const stage = definition.clueTransitions.find(transition =>
    !snapshot.processedTransitionIds.includes(transition.id) &&
    snapshot.confirmed[transition.selectionId] !== true &&
    transition.requiredClueIds.every(id => snapshot.activeClueIds.includes(id) || snapshot.archivedClueIds.includes(id)) &&
    definition.requiredConfirmations.includes(transition.selectionId));
  return stage?.selectionId ?? definition.requiredConfirmations.find(id => snapshot.confirmed[id] !== true);
}

function finalHint(session: PuzzleSession, options: Array<{ id: string; name: string }>): PuzzleHint | null {
  const excluded = options.find(option => option.id !== session.definition.correctFinalAnswerId);
  if (!excluded) return null;
  return { phase: 'final', text: `补充核查：可以排除「${excluded.name}」。\n\n继续把其他候选与本页前提、每个人的证词逐一核对。仍需由你选择答案并正式提交。` };
}

export function buildMainStoryHint(data: MainStoryCaseConfig, session: PuzzleSession): PuzzleHint | null {
  if (session.isPuzzleSolved()) return finalHint(session, data.finalOptions ?? data.people);
  const target = currentTarget(session);
  if (!target) return null;
  const [, pairId, personId, optionId] = target.split(':');
  const pair = data.pairs.find(item => item.id === pairId);
  const person = data.people.find(item => item.id === personId);
  const option = pair?.options.find(item => item.id === optionId);
  if (!pair || !person || !option) return null;
  return {
    phase: 'board', targetSelectionId: target,
    text: `补充记录：${person.name}对应的是「${option.name}」。\n\n请在「${pair.title}」中核对这组关系，再自行暂填和确认。`,
  };
}

interface Cell { row: number; column: number }
interface LandmarkFact { text: string; accepts(cell: Cell): boolean }

export function buildArchiveHint(data: ArchiveStoryCaseConfig, session: PuzzleSession): PuzzleHint | null {
  if (session.isPuzzleSolved()) return finalHint(session, data.finalOptions);
  const target = currentTarget(session);
  if (!target) return null;
  const [, subjectId, rowText, columnText] = target.split(':');
  const subject = data.subjects.find(item => item.id === subjectId);
  if (!subject) return null;
  const goal = { row: Number(rowText), column: Number(columnText) };
  const size = data.definition.gridSize;
  const snapshot = session.snapshot(), excluded = new Set(snapshot.autoExcludedSelectionIds);
  let candidates: Cell[] = [];
  for (let row = 1; row <= size; row++) for (let column = 1; column <= size; column++) {
    const selectionId = `placement:${subjectId}:${row}:${column}`;
    if (!excluded.has(selectionId) && snapshot.confirmed[selectionId] !== false) candidates.push({ row, column });
  }
  const facts: LandmarkFact[] = [];
  const add = (text: string, accepts: (cell: Cell) => boolean) => { if (accepts(goal)) facts.push({ text, accepts }); };
  for (const reference of data.referenceObjects) {
    const { row, column, label } = reference;
    add(`就在${label}所在的格子`, cell => cell.row === row && cell.column === column);
    add(`与${label}贴边相邻`, cell => Math.abs(cell.row - row) + Math.abs(cell.column - column) === 1);
    add(`与${label}斜角相邻`, cell => Math.abs(cell.row - row) === 1 && Math.abs(cell.column - column) === 1);
    add(`与${label}在同一横排`, cell => cell.row === row);
    add(`与${label}在同一竖排`, cell => cell.column === column);
    add(`在${label}北侧`, cell => cell.row < row);
    add(`在${label}南侧`, cell => cell.row > row);
    add(`在${label}西侧`, cell => cell.column < column);
    add(`在${label}东侧`, cell => cell.column > column);
    const region = data.definition.regionByCell?.[`${row},${column}`];
    if (region) add(`与${label}属于同一个${archiveRegionLabel(size)}`, cell =>
      data.definition.regionByCell?.[`${cell.row},${cell.column}`] === region);
  }
  add('紧贴北墙', cell => cell.row === 1);
  add('紧贴南墙', cell => cell.row === size);
  add('紧贴西墙', cell => cell.column === 1);
  add('紧贴东墙', cell => cell.column === size);
  const chosen: string[] = [];
  while (candidates.length > 1 && chosen.length < 3) {
    let best: LandmarkFact | undefined, bestCount = candidates.length;
    for (const fact of facts) {
      const count = candidates.filter(fact.accepts).length;
      if (count > 0 && count < bestCount) { best = fact; bestCount = count; }
    }
    if (!best) break;
    chosen.push(best.text);
    candidates = candidates.filter(best.accepts);
  }
  const guidance = chosen.length ? `补充记录：「${subject.name}」${chosen.join('，')}。` :
    `优先核对「${subject.name}」。已确认的材料占用了其他行、列或分组，请找尚未被排除的位置。`;
  return { phase: 'board', targetSelectionId: target,
    text: `${guidance}\n\n普通参照物格可以放材料，带“封”的格子不行。结合当前线索自行落位并确认。` };
}
