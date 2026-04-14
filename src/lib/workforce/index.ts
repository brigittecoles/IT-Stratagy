export {
  IT_TIERS, AI_TIERS,
  IT_ROLE_GROUPS,
  getRoleGroupBySOC, getRoleGroupsByTier,
  getRoleGroupsByAutomability, getTierSummary,
} from './role-definitions';
export type { ITTier, AITier, ITRoleGroup } from './role-definitions';

export {
  APQC_L1_CATEGORIES, APQC_L2_PROCESSES,
  getAPQC_L2, getITMappedProcesses,
  getProcessesByL1, getL1ForL2,
} from './apqc-processes';
export type { APQC_L1, APQC_L2 } from './apqc-processes';

export {
  CROSSWALK_DATA,
  getCrosswalkByTier, getCrosswalkBySOC, getCrosswalkByProcess,
  getHighConfidenceMappings, getCrosswalkByMinConfidence,
  getProcessesTouchedByTier, getAutomabilityByTier,
} from './crosswalk-data';
export type { CrosswalkConfidence, CrosswalkEntry, RACIType } from './crosswalk-data';

export {
  classifyRole, classifyRoleBatch, suggestTier,
} from './role-classifier';
export type { RoleClassificationInput, RoleClassificationResult } from './role-classifier';

export {
  deriveBaselines, getBaselineLookup, getFTELoadSummary,
} from './baseline-derivation';
export type { DerivedCrosswalkEntry } from './baseline-derivation';
