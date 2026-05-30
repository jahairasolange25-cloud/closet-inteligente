# Outfit Recommendation Engine

## Overview

Multi-priority recommendation engine for generating outfit combinations. Combines rule-based filtering, color wheel analysis, rotation scheduling, and optional AI style compatibility scoring.

---

## Architecture

```
User Preferences + Context
         |
         v
[1] Garment Availability Filter    ← state = available
         |
         v
[2] Rules Engine                   ← upper + lower, no washing, no duplicates
         |
         v
[3] Color Compatibility Score      ← color wheel harmony
         |
         v
[4] Rotation Score                 ← least recently used
         |
         v
[5] AI Style Score (optional)      ← embedding similarity
         |
         v
[6] Weighted Scoring & Ranking
         |
         v
Top N Recommendations
```

---

## Priority 1: Garment Availability Filter

**Filter:** Only garments with `state = 'available'`

```typescript
async function getAvailableGarments(userId: string): Promise<Garment[]> {
  const garments = await prisma.garment.findMany({
    where: {
      userId,
      state: 'available',
      deletedAt: null,
      imageUrl: { not: null },    // Must have image
      processingStatus: 'completed',  // Must be fully processed
    },
    orderBy: { lastWornAt: 'asc' },  // LRU ordering
  });

  return garments;
}
```

---

## Priority 2: Color Compatibility (Color Wheel Analysis)

**Algorithm:** Color wheel harmony using HSL color space

### Color Wheel Positions

```typescript
const COLOR_WHEEL_POSITIONS: Record<string, number> = {
  '#ff0000': 0,   // Rojo
  '#ff4500': 15,  // Naranja-rojo
  '#ff6600': 20,  // Naranja
  '#ffa500': 30,  // Naranja-amarillo
  '#ffff00': 60,  // Amarillo
  '#adff2f': 75,  // Amarillo-verde
  '#00ff00': 120, // Verde
  '#008080': 180, // Verde-azul (teal)
  '#0000ff': 240, // Azul
  '#4b0082': 270, // Azul-violeta
  '#8b00ff': 280, // Violeta
  '#ff00ff': 300, // Magenta
  '#ff1493': 320, // Rosa
};
```

### Harmony Types

| Type | Rule | Angle | Score Multiplier |
|------|------|-------|-----------------|
| Monochromatic | Same hue ± 10° | 0°–10° | 0.9 |
| Analogous | Adjacent hues | 30°–60° | 1.0 |
| Complementary | Opposite hues | 150°–180° | 1.0 |
| Split Complementary | Base ± 150° | 150° | 0.8 |
| Triadic | Every 120° | 120° | 0.7 |
| Square | Every 90° | 90° | 0.6 |
| Clash | 60°–90° offset | 60°–90° | 0.3 |

### Implementation

```typescript
function calculateColorCompatibility(garments: Garment[]): number {
  if (garments.length < 2) return 1.0; // Single garment = always compatible

  const colors = garments
    .map((g) => g.color || g.detectedDominantColors?.[0])
    .filter(Boolean);

  if (colors.length < 2) return 0.5; // Not enough color data

  // Get hue angles for each color
  const hues = colors.map((hex) => hexToHue(hex!));

  // For neutral colors (grayscale), always compatible
  const neutralHues = hues.filter((h) => h === null);
  const colorHues = hues.filter((h) => h !== null) as number[];

  if (colorHues.length <= 1) return 0.9; // Only one colored garment

  // Calculate pairwise harmony scores
  let totalScore = 0;
  let pairs = 0;

  for (let i = 0; i < colorHues.length; i++) {
    for (let j = i + 1; j < colorHues.length; j++) {
      const angle = Math.abs(colorHues[i] - colorHues[j]);
      const normalizedAngle = Math.min(angle, 360 - angle);
      totalScore += getHarmonyScore(normalizedAngle);
      pairs++;
    }
  }

  return totalScore / pairs;
}

function hexToHue(hex: string): number | null {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  if (max === min) return null; // Grayscale

  let hue = 0;
  const delta = max - min;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;

  return Math.round(hue * 60);
}

function getHarmonyScore(angle: number): number {
  if (angle <= 10) return 0.9;  // Monochromatic
  if (angle <= 60) return 1.0;  // Analogous
  if (Math.abs(angle - 180) <= 30) return 1.0;  // Complementary
  if (Math.abs(angle - 120) <= 15) return 0.7;  // Triadic
  if (angle >= 60 && angle <= 90) return 0.3;   // Clash
  return 0.5;  // No specific harmony
}
```

---

## Priority 3: Garment Rotation (Least Recently Used)

### Algorithm

```typescript
function calculateRotationScore(garment: Garment): number {
  if (!garment.lastWornAt) return 1.0;  // Never worn = highest priority

  const daysSinceWorn = Math.floor(
    (Date.now() - new Date(garment.lastWornAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Normalize to 0-1 score: garment worn 30+ days ago gets rotated in
  const score = Math.min(daysSinceWorn / 30, 1.0);

  // Bonus for never-worn garments
  if (garment.wearCount === 0) return Math.max(score, 0.8);

  return score;
}
```

### Wear Count Tracking

```typescript
// When outfit is scheduled on calendar
async function recordOutfitWear(outfitId: string, userId: string): Promise<void> {
  const outfit = await prisma.outfit.findUnique({
    where: { id: outfitId },
    include: {
      garments: {
        include: { garment: true },
      },
    },
  });

  for (const og of outfit!.outfitGarments) {
    await prisma.garment.update({
      where: { id: og.garment.id },
      data: {
        lastWornAt: new Date(),
        wearCount: { increment: 1 },
      },
    });
  }
}
```

---

## Rules Engine

### Mandatory Rules (Hard Constraints)

```typescript
function validateOutfitCombination(garments: Garment[]): ValidationResult {
  const rules: Rule[] = [
    // Rule 1: Must include upper body garment
    {
      name: 'UPPER_REQUIRED',
      validate: (g) => g.some((item) =>
        ['tops', 't-shirts', 'shirts', 'blouses', 'sweaters', 'dresses', 'jumpsuits']
          .includes(item.category)
      ),
      message: 'Debe incluir una prenda superior',
    },

    // Rule 2: Must include lower body garment (unless dress/jumpsuit)
    {
      name: 'LOWER_REQUIRED',
      validate: (g) => {
        const hasDress = g.some((item) =>
          ['dresses', 'jumpsuits'].includes(item.category)
        );
        const hasLower = g.some((item) =>
          ['bottoms', 'pants', 'jeans', 'shorts', 'skirts'].includes(item.category)
        );
        return hasDress || hasLower;
      },
      message: 'Debe incluir una prenda inferior',
    },

    // Rule 3: No garments in washing state
    {
      name: 'NO_WASHING',
      validate: (g) => g.every((item) => item.state !== 'washing'),
      message: 'Prenda en lavado no disponible',
    },

    // Rule 4: No same garment worn same day
    {
      name: 'NO_DUPLICATE_DAY',
      validate: async (g, userId) => {
        const today = new Date().toISOString().split('T')[0];
        const calendarEntry = await prisma.calendarEntry.findUnique({
          where: { userId_date: { userId, date: today } },
          include: { outfit: { include: { outfitGarments: true } } },
        });
        if (!calendarEntry) return true;
        const todayGarmentIds = calendarEntry.outfit.outfitGarments.map((og) => og.garmentId);
        return !g.some((item) => todayGarmentIds.includes(item.id));
      },
      message: 'Prenda ya usada hoy',
    },

    // Rule 5: Max one of each body slot
    {
      name: 'UNIQUE_SLOTS',
      validate: (g) => {
        const slots = g.map((item) => getGarmentSlot(item.category));
        const uniqueSlots = new Set(slots);
        return slots.length === uniqueSlots.length;
      },
      message: 'Solo una prenda por tipo',
    },
  ];

  // Check all rules
  for (const rule of rules) {
    const result = rule.validate(garments);
    if (typeof result === 'boolean' && !result) {
      return { valid: false, errors: [{ rule: rule.name, message: rule.message }] };
    }
  }

  return { valid: true, errors: [] };
}

function getGarmentSlot(category: string): 'upper' | 'lower' | 'footwear' | 'accessory' {
  const upper = ['tops', 't-shirts', 'shirts', 'blouses', 'sweaters', 'jackets',
                 'coats', 'hoodies', 'vests', 'dresses', 'jumpsuits', 'outerwear'];
  const lower = ['bottoms', 'pants', 'jeans', 'shorts', 'skirts'];
  const footwear = ['footwear', 'sneakers', 'boots', 'sandals', 'heels', 'flats'];
  const accessory = ['accessories', 'bags', 'hats', 'belts', 'scarves', 'jewelry', 'glasses'];

  if (upper.includes(category)) return 'upper';
  if (lower.includes(category)) return 'lower';
  if (footwear.includes(category)) return 'footwear';
  return 'accessory';
}
```

### Soft Rules (Preference Based)

```typescript
function applySoftRules(score: number, garments: Garment[], context: RecommendationContext): number {
  let adjusted = score;

  // Season match
  if (context.season) {
    const seasonScore = getSeasonCompatibility(garments, context.season);
    adjusted *= (0.7 + 0.3 * seasonScore);
  }

  // Occasion match
  if (context.occasion) {
    const occasionScore = getOccasionCompatibility(garments, context.occasion);
    adjusted *= (0.7 + 0.3 * occasionScore);
  }

  // Temperature match
  if (context.temperature !== null && context.temperature !== undefined) {
    const tempScore = getTemperatureCompatibility(garments, context.temperature);
    adjusted *= (0.8 + 0.2 * tempScore);
  }

  return adjusted;
}
```

---

## Scoring Algorithm

### Formula

```
Final Score = w_avail × score_avail + w_rules × score_rules + w_color × score_color + w_rotation × score_rotation + w_ai × score_ai

Where:
  w_avail    = 0.10 (gate: 0 or 1)
  w_rules    = 0.25 (gate: 0 or 1)
  w_color    = 0.25 (0–1)
  w_rotation = 0.20 (0–1)
  w_ai       = 0.20 (0–1, optional)
```

### Implementation

```typescript
interface ScoredCombination {
  garments: Garment[];
  score: number;
  breakdown: {
    availability: number;
    rules: number;
    color: number;
    rotation: number;
    ai: number;
    soft: number;
  };
}

async function scoreCombination(
  garments: Garment[],
  context: RecommendationContext,
  aiModel?: StyleModel
): Promise<ScoredCombination> {
  // Availability check
  const availScore = garments.every((g) => g.state === 'available') ? 1 : 0;

  // Rules check
  const ruleValidation = validateOutfitCombination(garments);
  const rulesScore = ruleValidation.valid ? 1 : 0;

  // Color compatibility
  const colorScore = calculateColorCompatibility(garments);

  // Rotation score (average)
  const rotationScore = garments.reduce((sum, g) =>
    sum + calculateRotationScore(g), 0) / garments.length;

  // AI style score (optional)
  let aiScore = 0.5;
  if (aiModel) {
    aiScore = await calculateAiStyleScore(garments, aiModel);
  }

  // Soft rules adjustment
  let softScore = 1.0;
  if (rulesScore > 0) {
    softScore = applySoftRules(1.0, garments, context);
  }

  // Final weighted score
  const WEIGHTS = {
    availability: 0.10,
    rules: 0.25,
    color: 0.25,
    rotation: 0.20,
    ai: 0.20,
  };

  const finalScore = 
    WEIGHTS.availability * availScore +
    WEIGHTS.rules * rulesScore +
    WEIGHTS.color * colorScore +
    WEIGHTS.rotation * rotationScore +
    WEIGHTS.ai * aiScore;

  return {
    garments,
    score: finalScore * softScore,
    breakdown: {
      availability: availScore,
      rules: rulesScore,
      color: colorScore,
      rotation: rotationScore,
      ai: aiScore,
      soft: softScore,
    },
  };
}
```

---

## Edge Cases

### No Valid Outfit Found

```typescript
async function handleNoValidOutfit(userId: string): Promise<RecommendationResult> {
  const garments = await getAvailableGarments(userId);

  if (garments.length === 0) {
    return {
      recommendations: [],
      meta: {
        totalCombinations: 0,
        processingTime: 0,
        message: 'No tienes prendas disponibles. ¡Añade prendas a tu armario!',
      },
    };
  }

  // Check if missing upper or lower
  const upperCount = garments.filter((g) =>
    ['tops', 't-shirts', 'shirts', 'blouses', 'sweaters'].includes(g.category)
  ).length;
  const lowerCount = garments.filter((g) =>
    ['bottoms', 'pants', 'jeans', 'shorts', 'skirts'].includes(g.category)
  ).length;
  const dressCount = garments.filter((g) =>
    ['dresses', 'jumpsuits'].includes(g.category)
  ).length;

  if (upperCount === 0 && dressCount === 0) {
    return {
      recommendations: [],
      meta: {
        totalCombinations: 0,
        processingTime: 0,
        message: 'No tienes prendas superiores disponibles',
      },
    };
  }

  if (lowerCount === 0 && dressCount === 0) {
    return {
      recommendations: [],
      meta: {
        totalCombinations: 0,
        processingTime: 0,
        message: 'No tienes prendas inferiores disponibles',
      },
    };
  }

  // Partial outfit: return what we can
  return generatePartialOutfit(garments, upperCount, lowerCount, dressCount);
}
```

### Partial Outfit Generation

```typescript
async function generatePartialOutfit(
  garments: Garment[],
  upperCount: number,
  lowerCount: number,
  dressCount: number
): Promise<RecommendationResult> {
  const partialOutfits: ScoredCombination[] = [];

  if (dressCount > 0) {
    const dresses = garments.filter((g) => ['dresses', 'jumpsuits'].includes(g.category));
    for (const dress of dresses) {
      partialOutfits.push(await scoreCombination([dress], {}));
    }
  } else if (upperCount > 0 && lowerCount === 0) {
    const uppers = garments.filter((g) =>
      ['tops', 't-shirts', 'shirts', 'blouses', 'sweaters'].includes(g.category)
    );
    for (const upper of uppers) {
      partialOutfits.push(await scoreCombination([upper], {}));
    }
  } else if (upperCount === 0 && lowerCount > 0) {
    const lowers = garments.filter((g) =>
      ['bottoms', 'pants', 'jeans', 'shorts', 'skirts'].includes(g.category)
    );
    for (const lower of lowers) {
      partialOutfits.push(await scoreCombination([lower], {}));
    }
  }

  // Add accessories where possible
  const accessories = garments.filter((g) =>
    ['accessories', 'bags', 'hats', 'belts', 'scarves', 'jewelry', 'glasses'].includes(g.category)
  );

  const enriched = partialOutfits.map((outfit) => ({
    ...outfit,
    garments: [...outfit.garments, accessories[0]].filter(Boolean),
  }));

  return {
    recommendations: enriched
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((o) => ({
        outfit: { garments: o.garments } as Outfit,
        score: o.score,
        reasons: ['Outfit parcial - añade más prendas para mejores combinaciones'],
        partialOutfit: true,
        missingType: lowerCount === 0 ? 'lower' : 'upper',
      })),
    meta: {
      totalCombinations: enriched.length,
      processingTime: 0,
      partialOutfit: true,
    },
  };
}
```

---

## Batch Recommendation for Calendar

```typescript
async function generateBatchForCalendar(
  userId: string,
  startDate: string,
  endDate: string
): Promise<CalendarFillResult> {
  const days = getDatesInRange(startDate, endDate);
  const results: CalendarEntry[] = [];

  for (const date of days) {
    const existing = await prisma.calendarEntry.findUnique({
      where: { userId_date: { userId, date } },
    });
    if (existing) continue; // Skip already scheduled days

    const dailyOutfit = await generateDailyOutfit(userId, date);
    if (dailyOutfit) {
      const entry = await prisma.calendarEntry.create({
        data: {
          userId,
          outfitId: dailyOutfit.id,
          date,
          notes: 'Recomendación automática',
        },
      });
      results.push(entry);
    }
  }

  return {
    filled: results.length,
    total: days.length,
    entries: results,
  };
}
```

---

## Caching Strategy

```typescript
// Cache key: recommendations:{userId}:{contextHash}
// Context hash = SHA256 of occasion + season + temperature + count
// TTL: 30 minutes
// Invalidated: on garment create/update/delete, on outfit create/delete

function buildContextHash(context: RecommendationContext): string {
  const str = JSON.stringify({
    occasion: context.occasion,
    season: context.season,
    temperature: context.temperature,
    count: context.count,
  });
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function getCachedRecommendations(
  userId: string,
  context: RecommendationContext
): Promise<RecommendationResult | null> {
  const hash = buildContextHash(context);
  const cached = await redis.get(`recommendations:${userId}:${hash}`);
  return cached ? JSON.parse(cached) : null;
}

async function cacheRecommendations(
  userId: string,
  context: RecommendationContext,
  result: RecommendationResult
): Promise<void> {
  const hash = buildContextHash(context);
  await redis.setex(`recommendations:${userId}:${hash}`, 1800, JSON.stringify(result));
}
```

---

## AI Model Integration for Style Compatibility

```typescript
async function calculateAiStyleScore(
  garments: Garment[],
  model: StyleModel
): Promise<number> {
  // Get embeddings for each garment
  const embeddings = await Promise.all(
    garments.map((g) => g.embedding)
  );

  if (embeddings.some((e) => !e)) return 0.5; // Missing embeddings

  // Calculate pairwise cosine similarity
  let totalSimilarity = 0;
  let pairs = 0;

  for (let i = 0; i < embeddings.length; i++) {
    for (let j = i + 1; j < embeddings.length; j++) {
      const similarity = cosineSimilarity(embeddings[i]!, embeddings[j]!);
      // Moderate similarity (0.4–0.7) = good style match
      // Too high = too similar (boring), too low = clash
      const styleScore = 1 - Math.abs(similarity - 0.55) * 2;
      totalSimilarity += styleScore;
      pairs++;
    }
  }

  return pairs > 0 ? totalSimilarity / pairs : 0.5;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
```
