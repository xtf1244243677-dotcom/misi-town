import {
  FinalDeduction,
  PuzzleDefinition,
  placementSelectionId,
  relationSelectionId,
} from '../core/PuzzleTypes';
import { additionalMainStoryCases } from './mainStoryChapterOne';
import { chapterTwoMainStoryCases } from './mainStoryChapterTwo';
import { mainStoryCasesM16ToM25 } from './mainStoryCasesM16ToM25';
import { mainStoryCasesM26ToM30 } from './mainStoryCasesM26ToM30';
import { mainStoryM31 } from './mainStoryM31';
import { mainStoryCasesM32ToM35 } from './mainStoryCasesM32ToM35';
import { mainStoryCasesM36ToM40 } from './mainStoryCasesM36ToM40';
import { mainStoryCasesM41ToM45 } from './mainStoryCasesM41ToM45';
import { mainStoryCasesM46ToM50 } from './mainStoryCasesM46ToM50';
import { mainStoryCasesM51ToM55 } from './mainStoryCasesM51ToM55';
import { mainStoryCasesM56ToM60 } from './mainStoryCasesM56ToM60';
import { mainStoryCasesM61ToM65 } from './mainStoryCasesM61ToM65';
import { mainStoryCasesM66ToM70 } from './mainStoryCasesM66ToM70';
import { mainStoryCasesM71ToM75 } from './mainStoryCasesM71ToM75';
import { mainStoryCasesM76ToM80 } from './mainStoryCasesM76ToM80';
import { mainStoryCasesM81ToM85 } from './mainStoryCasesM81ToM85';
import { mainStoryCasesM86ToM90 } from './mainStoryCasesM86ToM90';
import { mainStoryCasesM91ToM95 } from './mainStoryCasesM91ToM95';
import { mainStoryCasesM96ToM100 } from './mainStoryCasesM96ToM100';
import { buildArchiveRegions } from './archiveBoardRules';
import { archiveCaseTwo } from './archiveCaseTwo';
import { archiveCaseThree } from './archiveCaseThree';
import { archiveCaseFour } from './archiveCaseFour';
import { archiveCaseFive } from './archiveCaseFive';
import { archiveCaseSix } from './archiveCaseSix';
import { archiveCaseSeven } from './archiveCaseSeven';
import { archiveCaseEight } from './archiveCaseEight';
import { archiveCaseNine } from './archiveCaseNine';
import { archiveCaseTen } from './archiveCaseTen';

function buildRelationValues(
  pairId: string,
  leftOptions: string[],
  rightOptions: string[],
  matches: Record<string, string>,
): Record<string, boolean> {
  const values: Record<string, boolean> = {};
  for (const left of leftOptions) {
    for (const right of rightOptions) {
      values[relationSelectionId(pairId, left, right)] = matches[left] === right;
    }
  }
  return values;
}

function buildPlacementValues(
  characters: string[],
  placements: Record<string, [number, number]>,
  size: number,
): Record<string, boolean> {
  const values: Record<string, boolean> = {};
  for (const character of characters) {
    for (let row = 1; row <= size; row += 1) {
      for (let column = 1; column <= size; column += 1) {
        const [correctRow, correctColumn] = placements[character];
        values[placementSelectionId(character, row, column)] = row === correctRow && column === correctColumn;
      }
    }
  }
  return values;
}

const personIds = ['ari', 'zhou', 'mia', 'lin'];
const seatIds = ['window', 'counter', 'bookshelf', 'door'];
const itemIds = ['envelope', 'cake-order', 'umbrella', 'key'];
const seatPair = 'person-seat';
const itemPair = 'person-item';
const seatAnswers: Record<string, string> = {
  ari: 'window', zhou: 'counter', mia: 'bookshelf', lin: 'door',
};
const itemAnswers: Record<string, string> = {
  ari: 'cake-order', zhou: 'umbrella', mia: 'envelope', lin: 'key',
};

const teaShopValues = {
  ...buildRelationValues(seatPair, personIds, seatIds, seatAnswers),
  ...buildRelationValues(itemPair, personIds, itemIds, itemAnswers),
};

const rel = (pairId: string, person: string, option: string) =>
  relationSelectionId(pairId, person, option);

export const teaShopPrototype: PuzzleDefinition = {
  id: 'M01-tea-shop-v3',
  mode: 'logic-grid',
  gridSize: 4,
  initialLives: 2,
  reviveLives: 1,
  clues: [
    { id: 'M01-C01', text: '阿梨坐在窗边。' },
    { id: 'M01-C02', text: '周叔坐在米娅左侧。' },
    { id: 'M01-C03', text: '米娅坐在林老板左侧。' },
    { id: 'M01-C04', text: '窗边的居民拿到蛋糕订单。' },
    { id: 'M01-C05', text: '钥匙没有给窗边或吧台的居民。' },
    { id: 'M01-C06', text: '信封不在周叔和林老板手里。' },
  ],
  initialClueIds: ['M01-C01'],
  correctValues: teaShopValues,
  requiredConfirmations: [
    ...personIds.map((person) => rel(seatPair, person, seatAnswers[person])),
    ...personIds.map((person) => rel(itemPair, person, itemAnswers[person])),
  ],
  clueTransitions: [
    {
      id: 'M01-T01', selectionId: rel(seatPair, 'ari', 'window'),
      requiredClueIds: ['M01-C01'], archiveClueIds: ['M01-C01'], unlockClueIds: ['M01-C02', 'M01-C03'],
    },
    {
      id: 'M01-T02', selectionId: rel(seatPair, 'zhou', 'counter'),
      requiredClueIds: ['M01-C02', 'M01-C03'], archiveClueIds: ['M01-C02', 'M01-C03'], unlockClueIds: ['M01-C04'],
    },
    {
      id: 'M01-T03', selectionId: rel(seatPair, 'mia', 'bookshelf'),
      requiredClueIds: ['M01-C02', 'M01-C03'], archiveClueIds: ['M01-C02', 'M01-C03'], unlockClueIds: ['M01-C04'],
    },
    {
      id: 'M01-T04', selectionId: rel(seatPair, 'lin', 'door'),
      requiredClueIds: ['M01-C02', 'M01-C03'], archiveClueIds: ['M01-C02', 'M01-C03'], unlockClueIds: ['M01-C04'],
    },
    {
      id: 'M01-T05', selectionId: rel(itemPair, 'ari', 'cake-order'),
      requiredClueIds: ['M01-C04'], archiveClueIds: ['M01-C04'], unlockClueIds: ['M01-C05', 'M01-C06'],
    },
    { id: 'M01-T06', selectionId: rel(itemPair, 'lin', 'key'), requiredClueIds: ['M01-C05'], archiveClueIds: ['M01-C05'], unlockClueIds: [] },
    { id: 'M01-T07', selectionId: rel(itemPair, 'mia', 'envelope'), requiredClueIds: ['M01-C06'], archiveClueIds: ['M01-C06'], unlockClueIds: [] },
  ],
  correctFinalAnswerId: 'mia',
};

const museumPeople = ['he', 'chen-officer', 'lu-painter', 'shen-curator'];
const museumRooms = ['east-hall', 'central-gallery', 'sculpture-room', 'archive-room'];
const museumItems = ['antique-clock', 'catalog', 'gloves', 'key'];
const museumRoomAnswers: Record<string, string> = {
  he: 'central-gallery',
  'chen-officer': 'east-hall',
  'lu-painter': 'sculpture-room',
  'shen-curator': 'archive-room',
};
const museumItemAnswers: Record<string, string> = {
  he: 'catalog',
  'chen-officer': 'gloves',
  'lu-painter': 'antique-clock',
  'shen-curator': 'key',
};
const museumValues = {
  ...buildRelationValues('person-room', museumPeople, museumRooms, museumRoomAnswers),
  ...buildRelationValues('person-item', museumPeople, museumItems, museumItemAnswers),
};
const museumRoomRelation = (person: string, room: string) => relationSelectionId('person-room', person, room);
const museumItemRelation = (person: string, item: string) => relationSelectionId('person-item', person, item);

/** M02 playable data: a second main-story case, authored independently of the scene UI. */
export const museumPrototype: PuzzleDefinition = {
  id: 'M02-empty-gallery',
  mode: 'logic-grid',
  gridSize: 4,
  initialLives: 2,
  reviveLives: 1,
  clues: [
    { id: 'M02-C01', text: '小禾在中央展厅。' },
    { id: 'M02-C02', text: '沈馆长在档案室。' },
    { id: 'M02-C03', text: '按表头顺序，陈警员所在区域在陆画师之前。' },
    { id: 'M02-C04', text: '陈警员带着手套。' },
    { id: 'M02-C05', text: '雕塑室的到访者拿着古董钟。' },
    { id: 'M02-C06', text: '沈馆长拿着钥匙。' },
    { id: 'M02-C07', text: '小禾没有拿古董钟。' },
  ],
  initialClueIds: ['M02-C01', 'M02-C02'],
  correctValues: museumValues,
  requiredConfirmations: [
    ...museumPeople.map((person) => museumRoomRelation(person, museumRoomAnswers[person])),
    ...museumPeople.map((person) => museumItemRelation(person, museumItemAnswers[person])),
  ],
  clueTransitions: [
    { id: 'M02-T01', selectionId: museumRoomRelation('he', 'central-gallery'), requiredClueIds: ['M02-C01'], archiveClueIds: ['M02-C01'], unlockClueIds: ['M02-C03'] },
    { id: 'M02-T02', selectionId: museumRoomRelation('shen-curator', 'archive-room'), requiredClueIds: ['M02-C02'], archiveClueIds: ['M02-C02'], unlockClueIds: ['M02-C04'] },
    { id: 'M02-T03', selectionId: museumRoomRelation('chen-officer', 'east-hall'), requiredClueIds: ['M02-C03'], archiveClueIds: ['M02-C03'], unlockClueIds: ['M02-C05'] },
    { id: 'M02-T04', selectionId: museumItemRelation('chen-officer', 'gloves'), requiredClueIds: ['M02-C04'], archiveClueIds: ['M02-C04'], unlockClueIds: ['M02-C06'] },
    { id: 'M02-T05', selectionId: museumItemRelation('lu-painter', 'antique-clock'), requiredClueIds: ['M02-C05'], archiveClueIds: ['M02-C05'], unlockClueIds: ['M02-C07'] },
    { id: 'M02-T06', selectionId: museumItemRelation('shen-curator', 'key'), requiredClueIds: ['M02-C06'], archiveClueIds: ['M02-C06'], unlockClueIds: [] },
  ],
  correctFinalAnswerId: 'he',
};

const lighthousePeople = ['su-he', 'chen-uncle', 'xu-doctor', 'gu-chief'];
const entryTimes = ['21-00', '21-15', '21-30', '21-45'];
const lighthouseItems = ['tea-cup', 'patrol-log', 'oil-lamp', 'spare-key'];
const entryTimeAnswers: Record<string, string> = {
  'su-he': '21-15',
  'chen-uncle': '21-00',
  'xu-doctor': '21-45',
  'gu-chief': '21-30',
};
const lighthouseItemAnswers: Record<string, string> = {
  'su-he': 'oil-lamp',
  'chen-uncle': 'spare-key',
  'xu-doctor': 'tea-cup',
  'gu-chief': 'patrol-log',
};
const lighthouseValues = {
  ...buildRelationValues('person-time', lighthousePeople, entryTimes, entryTimeAnswers),
  ...buildRelationValues('person-item', lighthousePeople, lighthouseItems, lighthouseItemAnswers),
};
const lighthouseTimeRelation = (person: string, time: string) => relationSelectionId('person-time', person, time);
const lighthouseItemRelation = (person: string, item: string) => relationSelectionId('person-item', person, item);

/** M03 playable data: time-order deduction followed by an evidence question. */
export const lighthousePrototype: PuzzleDefinition = {
  id: 'M03-last-lighthouse-watch',
  mode: 'logic-grid',
  gridSize: 4,
  initialLives: 2,
  reviveLives: 1,
  clues: [
    { id: 'M03-C01', text: '陈叔最先进入灯塔。' },
    { id: 'M03-C02', text: '苏禾比顾警长先进入灯塔。' },
    { id: 'M03-C03', text: '顾警长比许医生先进入灯塔。' },
    { id: 'M03-C04', text: '最晚进入灯塔的人拿着茶杯。' },
    { id: 'M03-C05', text: '陈叔拿着备用钥匙。' },
    { id: 'M03-C06', text: '苏禾没有拿巡查日志。' },
  ],
  initialClueIds: ['M03-C01'],
  correctValues: lighthouseValues,
  requiredConfirmations: [
    ...lighthousePeople.map((person) => lighthouseTimeRelation(person, entryTimeAnswers[person])),
    ...lighthousePeople.map((person) => lighthouseItemRelation(person, lighthouseItemAnswers[person])),
  ],
  clueTransitions: [
    { id: 'M03-T01', selectionId: lighthouseTimeRelation('chen-uncle', '21-00'), requiredClueIds: ['M03-C01'], archiveClueIds: ['M03-C01'], unlockClueIds: ['M03-C02', 'M03-C03'] },
    { id: 'M03-T02', selectionId: lighthouseTimeRelation('su-he', '21-15'), requiredClueIds: ['M03-C02'], archiveClueIds: ['M03-C02'], unlockClueIds: ['M03-C04'] },
    { id: 'M03-T03', selectionId: lighthouseItemRelation('xu-doctor', 'tea-cup'), requiredClueIds: ['M03-C04'], archiveClueIds: ['M03-C04'], unlockClueIds: ['M03-C05'] },
    { id: 'M03-T04', selectionId: lighthouseTimeRelation('gu-chief', '21-30'), requiredClueIds: ['M03-C03'], archiveClueIds: ['M03-C03'], unlockClueIds: [] },
    { id: 'M03-T05', selectionId: lighthouseItemRelation('chen-uncle', 'spare-key'), requiredClueIds: ['M03-C05'], archiveClueIds: ['M03-C05'], unlockClueIds: ['M03-C06'] },
    { id: 'M03-T06', selectionId: lighthouseItemRelation('su-he', 'patrol-log'), requiredClueIds: ['M03-C06'], archiveClueIds: ['M03-C06'], unlockClueIds: [] },
  ],
  correctFinalAnswerId: 'xu-doctor',
};

export interface MainStoryCaseConfig {
  definition: PuzzleDefinition;
  title: string;
  intro?: string;
  /** Persistent case rules, available even after a dynamic clue is archived. */
  investigationNotes?: string;
  initialPairId?: string;
  themeId?: string;
  finalDeduction?: FinalDeduction;
  finalOptions?: Array<{ id: string; name: string }>;
  people: Array<{ id: string; name: string }>;
  pairs: Array<{
    id: string;
    title: string;
    options: Array<{ id: string; name: string }>;
  }>;
  finalQuestion: string;
  completionBody: string;
}

/** Presentation metadata consumed by the shared main-story relationship-grid view. */
export const mainStoryCases: MainStoryCaseConfig[] = [
  {
    definition: teaShopPrototype,
    title: '茶馆里的信',
    people: [
      { id: 'ari', name: '阿梨' }, { id: 'zhou', name: '周叔' },
      { id: 'mia', name: '米娅' }, { id: 'lin', name: '林老板' },
    ],
    pairs: [
      { id: seatPair, title: '人物 × 座位', options: [
        { id: 'window', name: '窗边' }, { id: 'counter', name: '吧台' },
        { id: 'bookshelf', name: '书架旁' }, { id: 'door', name: '门口' },
      ] },
      { id: itemPair, title: '人物 × 物品', options: [
        { id: 'envelope', name: '信封' }, { id: 'cake-order', name: '蛋糕订单' },
        { id: 'umbrella', name: '雨伞' }, { id: 'key', name: '钥匙' },
      ] },
    ],
    finalQuestion: '谁拿到了失踪的信封？',
    completionBody: '信封在米娅手里。她替邻居收起了被雨水打湿的信，还没来得及转交。\n\n雨停了，这份信终于能送到主人手中。',
  },
  {
    definition: museumPrototype,
    title: '美术馆的空展柜',
    people: [
      { id: 'he', name: '小禾' }, { id: 'chen-officer', name: '陈警员' },
      { id: 'lu-painter', name: '陆画师' }, { id: 'shen-curator', name: '沈馆长' },
    ],
    pairs: [
      { id: 'person-room', title: '人物 × 区域', options: [
        { id: 'east-hall', name: '东厅' }, { id: 'central-gallery', name: '中央展厅' },
        { id: 'sculpture-room', name: '雕塑室' }, { id: 'archive-room', name: '档案室' },
      ] },
      { id: 'person-item', title: '人物 × 物品', options: [
        { id: 'antique-clock', name: '古董钟' }, { id: 'catalog', name: '展品目录' },
        { id: 'gloves', name: '手套' }, { id: 'key', name: '钥匙' },
      ] },
    ],
    finalQuestion: '谁在中央展厅并带着展品目录？',
    completionBody: '小禾在中央展厅并带着展品目录，这还原了她当时的位置和物品。\n\n古董钟失窃一案仍需依据现场证据继续调查，不能只凭这条关系认定是谁拿走了钟。',
  },
  {
    definition: lighthousePrototype,
    title: '灯塔最后一班巡夜',
    people: [
      { id: 'su-he', name: '苏禾' }, { id: 'chen-uncle', name: '陈叔' },
      { id: 'xu-doctor', name: '许医生' }, { id: 'gu-chief', name: '顾警长' },
    ],
    pairs: [
      { id: 'person-time', title: '人物 × 进入时间', options: [
        { id: '21-00', name: '21:00' }, { id: '21-15', name: '21:15' },
        { id: '21-30', name: '21:30' }, { id: '21-45', name: '21:45' },
      ] },
      { id: 'person-item', title: '人物 × 携带物', options: [
        { id: 'tea-cup', name: '茶杯' }, { id: 'patrol-log', name: '巡查日志' },
        { id: 'oil-lamp', name: '油灯' }, { id: 'spare-key', name: '备用钥匙' },
      ] },
    ],
    finalQuestion: '谁最后进入灯塔，并拿着茶杯？',
    completionBody: '时间与物品关系已复原。档案馆现已开放，可查阅被封存的旧宅档案。',
  },
  ...additionalMainStoryCases,
  ...chapterTwoMainStoryCases,
  ...mainStoryCasesM16ToM25,
  ...mainStoryCasesM26ToM30,
  mainStoryM31,
  ...mainStoryCasesM32ToM35,
  ...mainStoryCasesM36ToM40,
  ...mainStoryCasesM41ToM45,
  ...mainStoryCasesM46ToM50,
  ...mainStoryCasesM51ToM55,
  ...mainStoryCasesM56ToM60,
  ...mainStoryCasesM61ToM65,
  ...mainStoryCasesM66ToM70,
  ...mainStoryCasesM71ToM75,
  ...mainStoryCasesM76ToM80,
  ...mainStoryCasesM81ToM85,
  ...mainStoryCasesM86ToM90,
  ...mainStoryCasesM91ToM95,
  ...mainStoryCasesM96ToM100,
];

/** Keep this milestone independent of how many cases have been authored. */
export const archiveUnlockMainCaseIndex = 2;

const place = (character: string, row: number, column: number) =>
  placementSelectionId(character, row, column);

interface ArchiveTransitionSpec {
  id: string;
  subjectId: string;
  row: number;
  column: number;
  requiredClueIds: string[];
  archiveClueIds: string[];
  unlockClueIds: string[];
}

function buildArchiveDefinition(
  id: string,
  gridSize: number,
  subjectIds: string[],
  placements: Record<string, [number, number]>,
  clues: Array<{ id: string; text: string }>,
  initialClueIds: string[],
  transitions: ArchiveTransitionSpec[],
  finalAnswerId: string,
): PuzzleDefinition {
  return {
    id,
    mode: 'archive-grid',
    gridSize,
    regionByCell: buildArchiveRegions(gridSize),
    initialLives: 2,
    reviveLives: 1,
    clues,
    initialClueIds,
    correctValues: buildPlacementValues(subjectIds, placements, gridSize),
    requiredConfirmations: subjectIds.map((subjectId) => {
      const [row, column] = placements[subjectId];
      return place(subjectId, row, column);
    }),
    clueTransitions: transitions.map((transition) => ({
      id: transition.id,
      selectionId: place(transition.subjectId, transition.row, transition.column),
      requiredClueIds: transition.requiredClueIds,
      archiveClueIds: transition.archiveClueIds,
      unlockClueIds: transition.unlockClueIds,
    })),
    correctFinalAnswerId: finalAnswerId,
  };
}

export interface ArchiveStoryCaseConfig {
  definition: PuzzleDefinition;
  collectionTitle?: string;
  title: string;
  subtitle: string;
  intro: string;
  question: string;
  completionBody: string;
  /** Revealed after the board is solved; independent of placement clues and file names. */
  finalDeduction: FinalDeduction;
  subjects: Array<{ id: string; name: string; shortName: string }>;
  finalOptions: Array<{ id: string; name: string; shortName: string }>;
  referenceObjects: Array<{ row: number; column: number; label: string; kind: 'window' | 'door' | 'shelf' | 'desk' | 'hallway' | 'steps' | 'hearth' | 'phone'; blocksPlacement?: boolean }>;
}

function clueProgression(
  prefix: string,
  subjectOne: { id: string; row: number; column: number },
  subjectTwo: { id: string; row: number; column: number },
  subjectThree: { id: string; row: number; column: number },
): ArchiveTransitionSpec[] {
  return [
    {
      id: `${prefix}-T01`, subjectId: subjectOne.id, row: subjectOne.row, column: subjectOne.column,
      requiredClueIds: [`${prefix}-C01`], archiveClueIds: [`${prefix}-C01`], unlockClueIds: [`${prefix}-C02`, `${prefix}-C03`],
    },
    {
      id: `${prefix}-T02`, subjectId: subjectTwo.id, row: subjectTwo.row, column: subjectTwo.column,
      requiredClueIds: [`${prefix}-C02`, `${prefix}-C03`], archiveClueIds: [`${prefix}-C02`, `${prefix}-C03`], unlockClueIds: [`${prefix}-C04`, `${prefix}-C05`],
    },
    {
      id: `${prefix}-T03`, subjectId: subjectThree.id, row: subjectThree.row, column: subjectThree.column,
      requiredClueIds: [`${prefix}-C04`, `${prefix}-C05`], archiveClueIds: [`${prefix}-C04`, `${prefix}-C05`], unlockClueIds: [],
    },
  ];
}

function fullClueProgression(
  prefix: string,
  orderedPlacements: Array<{ id: string; row: number; column: number }>,
): ArchiveTransitionSpec[] {
  const phases = orderedPlacements.map((_, index) => {
    if (index === 0) return [`${prefix}-C01`];
    if (index === 1) return [`${prefix}-C02`, `${prefix}-C03`];
    if (index === 2) return [`${prefix}-C04`, `${prefix}-C05`];
    return [`${prefix}-C${String(index + 3).padStart(2, '0')}`];
  });
  return orderedPlacements.map((placement, index) => ({
    id: `${prefix}-T${String(index + 1).padStart(2, '0')}`,
    subjectId: placement.id,
    row: placement.row,
    column: placement.column,
    requiredClueIds: phases[index],
    archiveClueIds: phases[index],
    unlockClueIds: phases[index + 1] ?? [],
  }));
}

const archiveCases: ArchiveStoryCaseConfig[] = [];

const a01Subjects = [
  { id: 'zhou-lan', name: '周岚', shortName: '周岚' },
  { id: 'lin-reporter', name: '林记者', shortName: '林记' },
  { id: 'aunt-xu', name: '许姨', shortName: '许姨' },
  { id: 'shen-doctor', name: '沈医生', shortName: '沈医' },
];
const a01Placements: Record<string, [number, number]> = {
  'zhou-lan': [1, 1], 'aunt-xu': [2, 3], 'lin-reporter': [3, 2], 'shen-doctor': [4, 4],
};
const a01Clues = [
  { id: 'A01-C01', text: '周岚的证词：散席时她一直守在北窗下；那扇窗开在旧宅北墙最靠西的一间房。' },
  { id: 'A01-C02', text: '林记者的速记本留在南半部最靠北的一道档案带。' },
  { id: 'A01-C03', text: '西侧长廊上的书架在雨夜倒塌，封住了靠墙的格位；速记本紧挨着书架内侧。' },
  { id: 'A01-C04', text: '许姨的门房笔记在速记本东北侧一间；她回到北侧房间时，记者还没有赶到。' },
  { id: 'A01-C05', text: '东门门牌上的红印来自许姨的门房登记；那份笔记紧贴门槛西侧。' },
];
const a01Definition = buildArchiveDefinition(
  'A01-old-house-v4', 4, a01Subjects.map((subject) => subject.id), a01Placements, a01Clues, ['A01-C01'],
  clueProgression('A01',
    { id: 'zhou-lan', row: 1, column: 1 },
    { id: 'lin-reporter', row: 3, column: 2 },
    { id: 'aunt-xu', row: 2, column: 3 }),
  'shen-doctor',
);
archiveCases.push({
  definition: a01Definition,
  title: '旧宅四人档案',
  subtitle: '一张没有标全的平面记录',
  intro: '多年前，乔先生在旧宅聚会当晚去世。结案记录称是突发疾病，但现场平面图残缺。先根据现存线索，复原四名相关人员的位置。',
  question: '谁摇响了召集众人的铃？',
  finalDeduction: {
    premise: '四人陆续离开前厅，离开后无人返回。铃只能在前厅摇响，且由四人之一摇响。以下四条经过均已核实。',
    testimonies: [
      { speakerId: 'zhou-lan', speakerName: '周岚', text: '我离开前厅时，林记者已经离开了。' },
      { speakerId: 'aunt-xu', speakerName: '许姨', text: '我比沈医生先离开前厅。' },
      { speakerId: 'lin-reporter', speakerName: '林记者', text: '周岚离开前厅后，沈医生才离开。' },
      { speakerId: 'shen-doctor', speakerName: '沈医生', text: '铃响时，四人中只剩最后一位还没离开前厅。' },
    ],
  },
  completionBody: '林记者先于周岚离开，周岚和许姨又都先于沈医生离开，因此最后留在前厅的是沈医生。铃响时只剩他，且无人返回，所以摇铃者只能是他。这能确认召集经过，不能据此判断死亡责任。',
  subjects: a01Subjects,
  referenceObjects: [
    { row: 1, column: 1, label: '北窗', kind: 'window' }, { row: 2, column: 4, label: '东门', kind: 'door' },
    { row: 3, column: 1, label: '封架', kind: 'shelf', blocksPlacement: true },
    { row: 4, column: 1, label: '西廊', kind: 'hallway' }, { row: 4, column: 4, label: '壁炉', kind: 'hearth' },
  ],
  finalOptions: [
    { id: 'zhou-lan', name: '周岚', shortName: '周岚' },
    { id: 'aunt-xu', name: '许姨', shortName: '许姨' },
    { id: 'lin-reporter', name: '林记者', shortName: '林记者' },
    { id: 'shen-doctor', name: '沈医生', shortName: '沈医生' },
  ],
});

const a02Subjects = [
  { id: 'zhou-register', name: '周岚的访客簿', shortName: '访客簿' },
  { id: 'aunt-gate-note', name: '许姨的门房笔记', shortName: '门房记' },
  { id: 'lin-short-note', name: '林记者的速记', shortName: '记者记' },
  { id: 'shen-copy', name: '沈医生的登记副本', shortName: '登记副本' },
];
const a02Placements: Record<string, [number, number]> = {
  'zhou-register': [1, 1], 'aunt-gate-note': [2, 3], 'lin-short-note': [3, 4], 'shen-copy': [4, 2],
};
const a02Clues = [
  { id: 'A02-C01', text: '访客簿封皮被暴雨泡皱，门房的红色印章盖在索引图最靠北、最靠西的角格。' },
  { id: 'A02-C02', text: '门房笔记夹在访客簿所在档案带以南、紧邻的那一道带里。' },
  { id: 'A02-C03', text: '门房笔记上的红泥印落在书架与门房桌之间。' },
  { id: 'A02-C04', text: '记者的速记末页盖着旧宅散席的印章；登记副本收在速记所在档案带以南紧邻的一道书架区。' },
  { id: 'A02-C05', text: '登记副本放在西侧书架区；访客簿已经占了最靠西的那一列。' },
];
const a02Definition = buildArchiveDefinition(
  'A02-storm-visitor-ledger-v3', 4, a02Subjects.map((subject) => subject.id), a02Placements, a02Clues, ['A02-C01'],
  clueProgression('A02',
    { id: 'zhou-register', row: 1, column: 1 },
    { id: 'aunt-gate-note', row: 2, column: 3 },
    { id: 'lin-short-note', row: 3, column: 4 }),
  'summary-fifteen-early',
);
archiveCases.push({
  definition: a02Definition,
  title: '暴雨夜的访客簿',
  subtitle: '四份记录，时间对不上',
  intro: '旧宅卷宗里保存着四份访客记录。它们被拆开放在档案索引盘中。先复原记录位置，再比较原始登记与结案摘要。',
  question: '结案摘要把沈医生离开外门的时间记成了怎样？',
  finalDeduction: {
    premise: '以下信息均已交叉核实；结案摘要记录的是离开旧宅外门的时间。请注意前厅与外门不是同一地点。',
    testimonies: [
      { speakerId: 'zhou-lan', speakerName: '周岚', text: '摘要写着：沈医生在22:00离开旧宅外门。' },
      { speakerId: 'aunt-xu', speakerName: '许姨', text: '前厅挂钟当晚始终比准确时间慢十分钟。' },
      { speakerId: 'lin-reporter', speakerName: '林记者', text: '他离开前厅时，我记下的挂钟读数是22:00。' },
      { speakerId: 'shen-doctor', speakerName: '沈医生', text: '我从前厅直接走到外门，正好用了五分钟，没有停留。' },
    ],
  },
  completionBody: '挂钟慢十分钟，读数22:00对应准确时间22:10。再加上走到外门的五分钟，实际离开外门是22:15。摘要写22:00，早记了十五分钟。时间差已经查明，但尚不能单独证明是谁改写记录。',
  subjects: a02Subjects,
  referenceObjects: [
    { row: 1, column: 1, label: '印台', kind: 'desk' }, { row: 2, column: 2, label: '封架', kind: 'shelf', blocksPlacement: true },
    { row: 2, column: 4, label: '门房桌', kind: 'desk' }, { row: 4, column: 2, label: '档案柜', kind: 'shelf' },
  ],
  finalOptions: [
    { id: 'summary-fifteen-late', name: '晚记十五分钟', shortName: '晚十五分' },
    { id: 'summary-fifteen-early', name: '早记十五分钟', shortName: '早十五分' },
    { id: 'summary-ten-early', name: '早记十分钟', shortName: '早十分' },
    { id: 'summary-accurate', name: '时间没有误差', shortName: '无误差' },
  ],
});

const a03Subjects = [
  { id: 'clinic-ledger', name: '诊疗室出库清单', shortName: '出库单' },
  { id: 'handover-slip', name: '值班交接单', shortName: '交接单' },
  { id: 'sealed-report', name: '封存检验页', shortName: '检验页' },
  { id: 'medicine-return', name: '物品归还记录', shortName: '归还单' },
  { id: 'dispatch-receipt', name: '诊疗物品签收回执', shortName: '签收回执' },
];
const a03Placements: Record<string, [number, number]> = {
  'clinic-ledger': [1, 2], 'handover-slip': [2, 4], 'sealed-report': [3, 1], 'medicine-return': [4, 3], 'dispatch-receipt': [5, 5],
};
const a03Clues = [
  { id: 'A03-C01', text: '出库清单页角沾着北窗的灰，档案员记得它夹在北窗正东、与窗同一横带紧邻的格位。' },
  { id: 'A03-C02', text: '值班员回忆：交接单收在比封存柜更靠北的位置。' },
  { id: 'A03-C03', text: '交接单在贴有“封”字的配药台（封台）正北方，与封台处在同一竖排。' },
  { id: 'A03-C04', text: '封存检验页的蜡印压在封存柜所在的那道横带上。' },
  { id: 'A03-C05', text: '检验页在交接单西侧；两页边角的同色索引印不能重叠。' },
  { id: 'A03-C06', text: '归还记录在检验页南边、出库清单东边；封存配药台挡住了它东邻格。归还单的入柜栏有勾记，却缺少签收编号；签收回执则夹在它更南边的档案带里。' },
  { id: 'A03-C07', text: '签收回执边角沾着诊疗室台阶的泥，是最后送回档案柜的一份。' },
];
const a03Definition = buildArchiveDefinition(
  'A03-clinic-inventory-5x5-v2', 5, a03Subjects.map((subject) => subject.id), a03Placements, a03Clues, ['A03-C01'],
  fullClueProgression('A03', [
    { id: 'clinic-ledger', row: 1, column: 2 }, { id: 'handover-slip', row: 2, column: 4 },
    { id: 'sealed-report', row: 3, column: 1 }, { id: 'medicine-return', row: 4, column: 3 },
    { id: 'dispatch-receipt', row: 5, column: 5 },
  ]),
  'aunt-xu',
);
archiveCases.push({
  definition: a03Definition,
  title: '诊疗室的旧清单',
  subtitle: '五份材料，交接链断了一环',
  intro: '访客簿指向旧宅使用过的诊疗物品。出库、交接、检验、归还与签收回执散落在索引盘上。请交叉核对位置线索，还原物品流转顺序。',
  question: '19:25时，诊疗包由谁保管？',
  finalDeduction: {
    premise: '四人分别在19:00、19:10、19:20、19:30签收同一只诊疗包，各签收一次。签收者保管至下一次交接。以下证词均已核实。',
    testimonies: [
      { speakerId: 'zhou-lan', speakerName: '周岚', text: '我的签收时间，比许姨晚十分钟。' },
      { speakerId: 'aunt-xu', speakerName: '许姨', text: '交接按签收单逐次完成，中途没有旁人代管。' },
      { speakerId: 'lin-reporter', speakerName: '林记者', text: '我比沈医生晚十分钟签收。' },
      { speakerId: 'shen-doctor', speakerName: '沈医生', text: '我的签收时间，比许姨早二十分钟。' },
    ],
  },
  completionBody: '沈医生比许姨早二十分钟，周岚又比许姨晚十分钟，四个时刻中只有许姨19:20签收可同时满足。因此沈医生19:00、林记者19:10、许姨19:20、周岚19:30签收。没有中途代管，19:25应由许姨保管；保管记录本身不等于作案证据。',
  subjects: a03Subjects,
  referenceObjects: [
    { row: 1, column: 1, label: '北窗', kind: 'window' }, { row: 2, column: 5, label: '东门', kind: 'door' },
    { row: 3, column: 2, label: '封存柜', kind: 'shelf' }, { row: 4, column: 4, label: '封台', kind: 'desk', blocksPlacement: true },
    { row: 5, column: 4, label: '台阶', kind: 'steps' },
  ],
  finalOptions: a01Subjects,
});

const a04Subjects = [
  { id: 'zhou-memo', name: '周岚的调查备忘', shortName: '调查备忘' },
  { id: 'aunt-testimony', name: '许姨的正式口供', shortName: '许姨口供' },
  { id: 'lin-interview', name: '林记者的采访速记', shortName: '采访速记' },
  { id: 'shen-statement', name: '沈医生的书面陈述', shortName: '书面陈述' },
  { id: 'gatekeeper-note', name: '门房的补充说明', shortName: '门房说明' },
];
const a04Placements: Record<string, [number, number]> = {
  'zhou-memo': [1, 2], 'aunt-testimony': [2, 4], 'lin-interview': [3, 1], 'shen-statement': [4, 3], 'gatekeeper-note': [5, 5],
};
const a04Clues = [
  { id: 'A04-C01', text: '周岚的调查备忘夹在北窗正东、与窗同一横带紧邻的一格；纸边还留着被雨水晕花的报时记录。' },
  { id: 'A04-C02', text: '许姨说，她的正式口供被收在索引盘北侧的两道档案带里。' },
  { id: 'A04-C03', text: '门房记得那份口供紧贴东门内侧；门外就是外墙，没有多余的房间。' },
  { id: 'A04-C04', text: '林记者的采访速记和封存的采访桌留在同一道横带；桌面已经贴上封条，不能放入材料。' },
  { id: 'A04-C05', text: '采访速记记下沈医生离开的时刻比许姨口供早了一刻；速记夹在许姨口供的西侧，两份材料的同色索引印不能重叠。' },
  { id: 'A04-C06', text: '采访速记背面写着：沈医生的陈述夹在南侧紧邻的档案带，隔着一列在电话机以西。' },
  { id: 'A04-C07', text: '门房的补充说明是在雨停后最后补交的一份，封口仍带着当夜雨渍；它压在最南端的档案带。' },
];
const a04Definition = buildArchiveDefinition(
  'A04-three-testimonies-5x5-v2', 5, a04Subjects.map((subject) => subject.id), a04Placements, a04Clues, ['A04-C01'],
  fullClueProgression('A04', [
    { id: 'zhou-memo', row: 1, column: 2 }, { id: 'aunt-testimony', row: 2, column: 4 },
    { id: 'lin-interview', row: 3, column: 1 }, { id: 'shen-statement', row: 4, column: 3 },
    { id: 'gatekeeper-note', row: 5, column: 5 },
  ]),
  'aunt-xu',
);
archiveCases.push({
  definition: a04Definition,
  title: '雨夜的证词',
  subtitle: '五份陈述，一处谎言',
  intro: '调查备忘、正式口供、采访速记、书面陈述和门房补充说明各自记录了当晚的一段经过。请把五份材料放回索引盘，找出互相印证与冲突的部分。',
  question: '谁取走了门房登记页？',
  finalDeduction: {
    premise: '五人中恰有一人取走登记页。此题已知：下面五句证词恰有一句假话，其余全真。取走者不一定是说谎者。',
    testimonies: [
      { speakerId: 'zhou-lan', speakerName: '周岚', text: '许姨和沈医生都没取走登记页。' },
      { speakerId: 'aunt-xu', speakerName: '许姨', text: '周岚和门房都没取走登记页。' },
      { speakerId: 'lin-reporter', speakerName: '林记者', text: '取走登记页的是门房或许姨。' },
      { speakerId: 'shen-doctor', speakerName: '沈医生', text: '不是门房取走的。' },
      { speakerId: 'gatekeeper', speakerName: '门房', text: '林记者没有取走登记页。' },
    ],
  },
  completionBody: '若是周岚、沈医生或林记者取走，都会出现两句假话；若是门房取走，许姨与沈医生的证词都会为假。只有许姨取走时，仅周岚那句为假，其余四句全真。故取走者是许姨，说谎者是周岚；这一结论尚不能判断谁造成乔先生死亡。',
  subjects: a04Subjects,
  referenceObjects: [
    { row: 1, column: 1, label: '北窗', kind: 'window' }, { row: 2, column: 5, label: '东门', kind: 'door' },
    { row: 3, column: 3, label: '封桌', kind: 'desk', blocksPlacement: true }, { row: 4, column: 5, label: '电话机', kind: 'phone' },
    { row: 5, column: 4, label: '外廊', kind: 'hallway' },
  ],
  finalOptions: [...a01Subjects, { id: 'gatekeeper', name: '门房', shortName: '门房' }],
});

const a05Subjects = [
  { id: 'zhou-audit-copy', name: '周岚的账目副页', shortName: '账目副页' },
  { id: 'aunt-index', name: '许姨的卷宗索引', shortName: '卷宗索引' },
  { id: 'lin-missing-page', name: '林记者找到的结案页', shortName: '结案页' },
  { id: 'shen-expense', name: '沈医生的经手凭据', shortName: '经手凭据' },
  { id: 'aunt-envelope', name: '许姨保管的封存信封', shortName: '封存信封' },
  { id: 'clerk-revision', name: '档案员的修改登记', shortName: '修改登记' },
];
const a05Placements: Record<string, [number, number]> = {
  'zhou-audit-copy': [1, 1], 'aunt-index': [2, 3], 'lin-missing-page': [3, 5], 'shen-expense': [4, 2], 'aunt-envelope': [5, 4], 'clerk-revision': [6, 6],
};
const a05Clues = [
  { id: 'A05-C01', text: '账目副页从卷首被抽出，留下的红印压在索引盘最北、最西的角格。' },
  { id: 'A05-C02', text: '许姨找到的卷宗索引夹在账目副页以南紧邻的档案带。' },
  { id: 'A05-C03', text: '索引页在账目副页以东，正夹在中央书架西侧紧邻的通道格；手绘圈标记也落在那条通道上。' },
  { id: 'A05-C04', text: '林记者找到的结案页被移入卷宗索引以南紧邻的档案带。' },
  { id: 'A05-C05', text: '结案页在索引以东，靠近东门，却没有贴着最外侧柜板。' },
  { id: 'A05-C06', text: '沈医生的经手凭据夹在结案页南侧紧邻的档案带，位于账目柜右侧的西半边；签字确认他在病发当夜领走一份封存诊疗包。倒塌书架封住这带最东侧的一格。' },
  { id: 'A05-C07', text: '封存信封在经手凭据以南紧邻的档案带，封条贴着封存柜西侧的书架通道；里面留有与诊疗包同号的封签，但归还记录缺少对应签收。' },
  { id: 'A05-C08', text: '修改登记压在装订台所在的最南一带，签字抵着最东侧的装订边；变更栏记着结案后有人改写诊疗包记录，签名处是沈医生。' },
];
const a05Definition = buildArchiveDefinition(
  'A05-case-summary-6x6-v2', 6, a05Subjects.map((subject) => subject.id), a05Placements, a05Clues, ['A05-C01'],
  fullClueProgression('A05', [
    { id: 'zhou-audit-copy', row: 1, column: 1 }, { id: 'aunt-index', row: 2, column: 3 },
    { id: 'lin-missing-page', row: 3, column: 5 }, { id: 'shen-expense', row: 4, column: 2 },
    { id: 'aunt-envelope', row: 5, column: 4 }, { id: 'clerk-revision', row: 6, column: 6 },
  ]),
  'shen-doctor',
);
archiveCases.push({
  definition: a05Definition,
  title: '被抽走的结案页',
  subtitle: '六份材料拼出缺失的结案经过',
  intro: '访客时间差、诊疗包的交接和被取走的登记页，让旧案留下更多疑点。先复原六份材料，再阅读新核实的现场证词，追查乔先生饮茶前发生的调包。',
  question: '谁在备茶间调包，导致乔先生死亡？',
  finalDeduction: {
    premise: '复核确认：乔先生死于用被调包的茶叶泡成的茶；调包发生在备茶间，由这四人中的一人单独完成。以下四条均已核实。',
    testimonies: [
      { speakerId: 'zhou-lan', speakerName: '周岚', text: '茶罐19:40验封完好，19:50取茶时已被调包。这十分钟它一直在备茶间。' },
      { speakerId: 'aunt-xu', speakerName: '许姨', text: '19:40验封后室内无人，门已锁好；进入须亲自用钥匙，窗户封死，门窗无破损。' },
      { speakerId: 'lin-reporter', speakerName: '林记者', text: '唯一的日用钥匙19:35交给沈医生，19:55交回；期间始终由他随身持有，未交给别人。' },
      { speakerId: 'shen-doctor', speakerName: '沈医生', text: '能开门的只有日用钥匙和备用钥匙；备用钥匙当晚一直封存，封条完好。' },
    ],
  },
  completionBody: '调包只能发生在19:40至19:50。验封后房内无人，进入须用钥匙；备用钥匙未启封，日用钥匙在整个时段只由沈医生持有。因此四人中只有他能进入完成调包。再结合已核实的调包与死亡因果，责任指向沈医生；不是因为他是医生或曾保管诊疗包。',
  subjects: a05Subjects,
  referenceObjects: [
    { row: 1, column: 1, label: '印章台', kind: 'desk' }, { row: 2, column: 4, label: '书架', kind: 'shelf' },
    { row: 3, column: 6, label: '东门', kind: 'door' }, { row: 4, column: 1, label: '账目柜', kind: 'shelf' },
    { row: 4, column: 3, label: '封架', kind: 'shelf', blocksPlacement: true },
    { row: 5, column: 5, label: '封存柜', kind: 'shelf' }, { row: 6, column: 6, label: '装订台', kind: 'desk' },
  ],
  finalOptions: [
    { id: 'zhou-lan', name: '周岚', shortName: '周岚' },
    { id: 'aunt-xu', name: '许姨', shortName: '许姨' },
    { id: 'lin-reporter', name: '林记者', shortName: '林记者' },
    { id: 'shen-doctor', name: '沈医生', shortName: '沈医生' },
  ],
});

archiveCases.push(...archiveCaseTwo);
archiveCases.push(...archiveCaseThree);
archiveCases.push(...archiveCaseFour);
archiveCases.push(...archiveCaseFive);
archiveCases.push(...archiveCaseSix);
archiveCases.push(...archiveCaseSeven);
archiveCases.push(...archiveCaseEight);
archiveCases.push(...archiveCaseNine);
archiveCases.push(...archiveCaseTen);

// The picture, label, and placement rule use one source so a visual blocker
// cannot silently disagree with the board's playable-cell data.
archiveCases.forEach((archiveCase) => {
  const blockedCellIds = archiveCase.referenceObjects
    .filter((reference) => reference.blocksPlacement)
    .map((reference) => `${reference.row},${reference.column}`);
  if (blockedCellIds.length) archiveCase.definition.blockedCellIds = blockedCellIds;
});

export const archiveStoryCases = archiveCases;
export const archivePrototype = a01Definition;

