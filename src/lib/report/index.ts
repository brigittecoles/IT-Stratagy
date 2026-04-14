export {
  generateReport,
} from './report-generator';
export type {
  AnalysisResults,
  PopulatedSection,
  GeneratedReport,
} from './report-generator';

export {
  generateChainOfThought,
  formatChainOfThoughtMarkdown,
} from './chain-of-thought';
export type {
  CoTSection,
  CoTStep,
  ChainOfThought,
} from './chain-of-thought';

export {
  SHEET_DEFINITIONS,
  getSheetDefinition,
  getSheetByName,
  getAllSheetDefinitions,
  getAllSlots,
  getNarrativeSlots,
  getDataSlots,
} from './template-definitions';
export type {
  SectionType,
  BannerColor,
  SectionSlot,
  TableColumn,
  SheetSection,
  SheetDefinition,
} from './template-definitions';
