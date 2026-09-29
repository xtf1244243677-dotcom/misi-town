import { placementSelectionId, PuzzleDefinition } from '../core/PuzzleTypes';
import { buildArchiveRegions } from './archiveBoardRules';
import type { ArchiveStoryCaseConfig } from './casePrototypes';

interface RecordPlacement {
  id: string;
  name: string;
  shortName: string;
  row: number;
  column: number;
  clues: string[];
}
export interface ArchiveVolumeSpec {
  id: string;
  title: string;
  subtitle: string;
  intro: string;
  size: number;
  records: RecordPlacement[];
  references: ArchiveStoryCaseConfig['referenceObjects'];
  question: string;
  premise: string;
  testimonies: string[];
  options: Array<{ id: string; name: string }>;
  answerId: string;
  completion: string;
}

/** Authoring guards protect runtime from inconsistent coordinates or missing final options. */
export function buildArchiveVolume(spec: ArchiveVolumeSpec, collectionTitle: string, witnesses: Array<{ id: string; name: string }>): ArchiveStoryCaseConfig {
  const regions = buildArchiveRegions(spec.size);
  const blocked = spec.references.filter(reference => reference.blocksPlacement).map(reference => `${reference.row},${reference.column}`);
  if (spec.records.length !== spec.size || spec.testimonies.length !== witnesses.length ||
    !spec.options.some(option => option.id === spec.answerId) ||
    new Set(spec.records.map(record => record.id)).size !== spec.size) throw new Error(`Incomplete archive volume: ${spec.id}`);
  const occupiedRows = new Set<number>(), occupiedColumns = new Set<number>(), occupiedRegions = new Set<string>();
  const referenceCells = new Set<string>(), referenceNames = new Set<string>();
  for (const reference of spec.references) {
    const key = `${reference.row},${reference.column}`;
    if (!regions[key] || !reference.label.trim() || referenceCells.has(key) || referenceNames.has(reference.label)) {
      throw new Error(`Invalid archive reference: ${spec.id}/${reference.label}`);
    }
    referenceCells.add(key); referenceNames.add(reference.label);
  }
  for (const record of spec.records) {
    const key = `${record.row},${record.column}`;
    if (!regions[key] || blocked.includes(key) || occupiedRows.has(record.row) ||
      occupiedColumns.has(record.column) || occupiedRegions.has(regions[key])) throw new Error(`Invalid archive placement: ${spec.id}/${record.id}`);
    occupiedRows.add(record.row); occupiedColumns.add(record.column); occupiedRegions.add(regions[key]);
  }
  const prefix = spec.id.slice(0, 3);
  const phases = spec.records.map((record, index) => record.clues.map((text, clueIndex) => ({ id: `${prefix}-S${index + 1}-C${clueIndex + 1}`, text })));
  const correctValues: Record<string, boolean> = {};
  for (const record of spec.records) for (let row = 1; row <= spec.size; row++) for (let column = 1; column <= spec.size; column++) {
    correctValues[placementSelectionId(record.id, row, column)] = row === record.row && column === record.column;
  }
  const definition: PuzzleDefinition = {
    id: spec.id, mode: 'archive-grid', gridSize: spec.size, regionByCell: regions, blockedCellIds: blocked,
    initialLives: 2, reviveLives: 1, clues: phases.reduce((all, phase) => all.concat(phase), []),
    initialClueIds: phases[0].map(clue => clue.id), correctValues,
    requiredConfirmations: spec.records.map(record => placementSelectionId(record.id, record.row, record.column)),
    clueTransitions: spec.records.map((record, index) => ({
      id: `${prefix}-T${index + 1}`, selectionId: placementSelectionId(record.id, record.row, record.column),
      requiredClueIds: phases[index].map(clue => clue.id), archiveClueIds: phases[index].map(clue => clue.id),
      unlockClueIds: (phases[index + 1] ?? []).map(clue => clue.id),
    })),
    correctFinalAnswerId: spec.answerId,
  };
  return {
    definition, collectionTitle, title: spec.title, subtitle: spec.subtitle, intro: spec.intro,
    subjects: spec.records.map(({ id, name, shortName }) => ({ id, name, shortName })),
    referenceObjects: spec.references, question: spec.question, completionBody: spec.completion,
    finalOptions: spec.options.map(option => ({ ...option, shortName: option.name })),
    finalDeduction: { premise: spec.premise, testimonies: witnesses.map((witness, index) => ({ speakerId: witness.id, speakerName: witness.name, text: spec.testimonies[index] })) },
  };
}
