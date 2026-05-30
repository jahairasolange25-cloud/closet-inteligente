export enum GarmentFitSlot {
  UPPER = 'upper',
  LOWER = 'lower',
  FOOTWEAR = 'footwear',
  ACCESSORY = 'accessory',
  FULL_BODY = 'full_body',
}

export enum GarmentLayer {
  BASE = 'base',
  MID = 'mid',
  OUTER = 'outer',
  ACCESSORY_OVERLAY = 'accessory_overlay',
}

export enum SkeletonBoneGroup {
  SPINE = 'spine',
  LEFT_ARM = 'left_arm',
  RIGHT_ARM = 'right_arm',
  LEFT_LEG = 'left_leg',
  RIGHT_LEG = 'right_leg',
  HEAD = 'head',
}

export interface SkeletonMapping {
  boneName: string;
  boneGroup: SkeletonBoneGroup;
  parentBone: string | null;
  defaultPosition: [number, number, number];
  defaultRotation: [number, number, number];
  defaultScale: [number, number, number];
}

export interface GarmentAttachmentPoint {
  slot: GarmentFitSlot;
  layer: GarmentLayer;
  targetBone: string;
  offsetPosition: [number, number, number];
  offsetRotation: [number, number, number];
  scaleMultiplier: number;
}

export interface GarmentFitConfiguration {
  id: string;
  garmentId: string;
  slot: GarmentFitSlot;
  layer: GarmentLayer;
  attachmentPoints: GarmentAttachmentPoint[];
  skeletonMappingId: string;
  meshConfig: GarmentMeshConfig;
  conflictRules: GarmentConflictRule[];
}

export interface GarmentMeshConfig {
  lodLevels: LODLevel[];
  textureSize: number;
  vertexLimit: number;
  triangleLimit: number;
  compressionSettings: TextureCompressionSettings;
}

export interface LODLevel {
  distance: number;
  vertexReduction: number;
  textureReduction: number;
}

export interface TextureCompressionSettings {
  format: 'ktx2' | 'webp' | 'png';
  quality: number;
  maxTextureSize: number;
}

export interface GarmentConflictRule {
  conflictWithSlot: GarmentFitSlot[];
  conflictWithLayer: GarmentLayer[];
  resolution: 'hide_other' | 'replace_other' | 'skip_both' | 'allow_overlap';
}

export interface ClothConflictResult {
  hasConflict: boolean;
  conflicts: Array<{
    garmentA: string;
    garmentB: string;
    rule: string;
    resolution: string;
  }>;
}

export interface BodyMeasurementSet {
  heightCm: number;
  chestCm: number;
  waistCm: number;
  hipsCm: number;
  inseamCm: number;
  shoulderWidthCm: number;
  armLengthCm: number;
  legLengthCm: number;
  torsoLengthCm: number;
  bodyShape: 'ectomorph' | 'mesomorph' | 'endomorph' | 'custom';
}

export const DEFAULT_SKELETON_MAPPINGS: SkeletonMapping[] = [
  { boneName: 'Hips', boneGroup: SkeletonBoneGroup.SPINE, parentBone: null, defaultPosition: [0, 0, 0], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'Spine', boneGroup: SkeletonBoneGroup.SPINE, parentBone: 'Hips', defaultPosition: [0, 0.1, 0], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'Chest', boneGroup: SkeletonBoneGroup.SPINE, parentBone: 'Spine', defaultPosition: [0, 0.15, 0], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'UpperChest', boneGroup: SkeletonBoneGroup.SPINE, parentBone: 'Chest', defaultPosition: [0, 0.1, 0], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'Neck', boneGroup: SkeletonBoneGroup.SPINE, parentBone: 'UpperChest', defaultPosition: [0, 0.08, 0], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'Head', boneGroup: SkeletonBoneGroup.HEAD, parentBone: 'Neck', defaultPosition: [0, 0.15, 0], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'LeftShoulder', boneGroup: SkeletonBoneGroup.LEFT_ARM, parentBone: 'UpperChest', defaultPosition: [-0.15, 0.02, 0], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'LeftArm', boneGroup: SkeletonBoneGroup.LEFT_ARM, parentBone: 'LeftShoulder', defaultPosition: [-0.05, 0, 0], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'LeftForeArm', boneGroup: SkeletonBoneGroup.LEFT_ARM, parentBone: 'LeftArm', defaultPosition: [-0.05, 0, 0], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'LeftHand', boneGroup: SkeletonBoneGroup.LEFT_ARM, parentBone: 'LeftForeArm', defaultPosition: [-0.03, 0, 0], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'RightShoulder', boneGroup: SkeletonBoneGroup.RIGHT_ARM, parentBone: 'UpperChest', defaultPosition: [0.15, 0.02, 0], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'RightArm', boneGroup: SkeletonBoneGroup.RIGHT_ARM, parentBone: 'RightShoulder', defaultPosition: [0.05, 0, 0], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'RightForeArm', boneGroup: SkeletonBoneGroup.RIGHT_ARM, parentBone: 'RightArm', defaultPosition: [0.05, 0, 0], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'RightHand', boneGroup: SkeletonBoneGroup.RIGHT_ARM, parentBone: 'RightForeArm', defaultPosition: [0.03, 0, 0], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'LeftUpperLeg', boneGroup: SkeletonBoneGroup.LEFT_LEG, parentBone: 'Hips', defaultPosition: [-0.08, -0.05, 0], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'LeftLowerLeg', boneGroup: SkeletonBoneGroup.LEFT_LEG, parentBone: 'LeftUpperLeg', defaultPosition: [0, -0.2, 0], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'LeftFoot', boneGroup: SkeletonBoneGroup.LEFT_LEG, parentBone: 'LeftLowerLeg', defaultPosition: [0, -0.05, 0.02], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'LeftToes', boneGroup: SkeletonBoneGroup.LEFT_LEG, parentBone: 'LeftFoot', defaultPosition: [0, 0, 0.03], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'RightUpperLeg', boneGroup: SkeletonBoneGroup.RIGHT_LEG, parentBone: 'Hips', defaultPosition: [0.08, -0.05, 0], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'RightLowerLeg', boneGroup: SkeletonBoneGroup.RIGHT_LEG, parentBone: 'RightUpperLeg', defaultPosition: [0, -0.2, 0], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'RightFoot', boneGroup: SkeletonBoneGroup.RIGHT_LEG, parentBone: 'RightLowerLeg', defaultPosition: [0, -0.05, 0.02], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
  { boneName: 'RightToes', boneGroup: SkeletonBoneGroup.RIGHT_LEG, parentBone: 'RightFoot', defaultPosition: [0, 0, 0.03], defaultRotation: [0, 0, 0], defaultScale: [1, 1, 1] },
];

export const DEFAULT_GARMENT_ATTACHMENTS: Record<GarmentFitSlot, GarmentAttachmentPoint[]> = {
  [GarmentFitSlot.UPPER]: [
    { slot: GarmentFitSlot.UPPER, layer: GarmentLayer.BASE, targetBone: 'UpperChest', offsetPosition: [0, 0.05, -0.02], offsetRotation: [0, 0, 0], scaleMultiplier: 1.0 },
    { slot: GarmentFitSlot.UPPER, layer: GarmentLayer.MID, targetBone: 'Chest', offsetPosition: [0, 0.02, 0], offsetRotation: [0, 0, 0], scaleMultiplier: 1.05 },
  ],
  [GarmentFitSlot.LOWER]: [
    { slot: GarmentFitSlot.LOWER, layer: GarmentLayer.BASE, targetBone: 'Hips', offsetPosition: [0, -0.02, 0], offsetRotation: [0, 0, 0], scaleMultiplier: 1.0 },
  ],
  [GarmentFitSlot.FOOTWEAR]: [
    { slot: GarmentFitSlot.FOOTWEAR, layer: GarmentLayer.BASE, targetBone: 'LeftFoot', offsetPosition: [0, 0, 0], offsetRotation: [0, 0, 0], scaleMultiplier: 1.0 },
    { slot: GarmentFitSlot.FOOTWEAR, layer: GarmentLayer.BASE, targetBone: 'RightFoot', offsetPosition: [0, 0, 0], offsetRotation: [0, 0, 0], scaleMultiplier: 1.0 },
  ],
  [GarmentFitSlot.ACCESSORY]: [
    { slot: GarmentFitSlot.ACCESSORY, layer: GarmentLayer.ACCESSORY_OVERLAY, targetBone: 'Head', offsetPosition: [0, 0.1, 0], offsetRotation: [0, 0, 0], scaleMultiplier: 0.8 },
    { slot: GarmentFitSlot.ACCESSORY, layer: GarmentLayer.ACCESSORY_OVERLAY, targetBone: 'LeftHand', offsetPosition: [0, 0, 0], offsetRotation: [0, 0, 0], scaleMultiplier: 0.6 },
  ],
  [GarmentFitSlot.FULL_BODY]: [
    { slot: GarmentFitSlot.FULL_BODY, layer: GarmentLayer.BASE, targetBone: 'Hips', offsetPosition: [0, 0, 0], offsetRotation: [0, 0, 0], scaleMultiplier: 1.0 },
  ],
};

export const GARMENT_CONFLICT_RULES: GarmentConflictRule[] = [
  { conflictWithSlot: [GarmentFitSlot.UPPER, GarmentFitSlot.FULL_BODY], conflictWithLayer: [GarmentLayer.BASE], resolution: 'hide_other' },
  { conflictWithSlot: [GarmentFitSlot.LOWER, GarmentFitSlot.FULL_BODY], conflictWithLayer: [GarmentLayer.BASE], resolution: 'hide_other' },
  { conflictWithSlot: [GarmentFitSlot.UPPER], conflictWithLayer: [GarmentLayer.OUTER, GarmentLayer.MID], resolution: 'allow_overlap' },
  { conflictWithSlot: [GarmentFitSlot.ACCESSORY, GarmentFitSlot.ACCESSORY], conflictWithLayer: [GarmentLayer.ACCESSORY_OVERLAY], resolution: 'allow_overlap' },
];

export function detectClothConflicts(
  configurations: GarmentFitConfiguration[],
): ClothConflictResult {
  const conflicts: ClothConflictResult['conflicts'] = [];

  for (let i = 0; i < configurations.length; i++) {
    for (let j = i + 1; j < configurations.length; j++) {
      const a = configurations[i];
      const b = configurations[j];

      for (const rule of a.conflictRules) {
        if (
          rule.conflictWithSlot.includes(b.slot) &&
          rule.conflictWithLayer.includes(b.layer)
        ) {
          conflicts.push({
            garmentA: a.garmentId,
            garmentB: b.garmentId,
            rule: `${a.slot} conflicts with ${b.slot}`,
            resolution: rule.resolution,
          });
        }
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

export function normalizeBodyMeasurements(
  measurements: Partial<BodyMeasurementSet>,
): BodyMeasurementSet {
  return {
    heightCm: measurements.heightCm ?? 170,
    chestCm: measurements.chestCm ?? 90,
    waistCm: measurements.waistCm ?? 75,
    hipsCm: measurements.hipsCm ?? 95,
    inseamCm: measurements.inseamCm ?? 78,
    shoulderWidthCm: measurements.shoulderWidthCm ?? 42,
    armLengthCm: measurements.armLengthCm ?? 60,
    legLengthCm: measurements.legLengthCm ?? 75,
    torsoLengthCm: measurements.torsoLengthCm ?? 50,
    bodyShape: measurements.bodyShape ?? 'mesomorph',
  };
}
