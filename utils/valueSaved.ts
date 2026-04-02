export interface ValueSavedResult {
  timeHoursSaved: number;
  wasteCostAvoided: number;
  confidenceScore: number;
}

export function calculateValueSaved(input: {
  recommendedBankAh: number;
  recommendedSolarW: number;
  dailyAh: number;
  inverterSize: number;
  dcDcChargerSize: number;
}): ValueSavedResult {
  const complexity =
    (input.recommendedBankAh / 100) * 0.8 +
    (input.recommendedSolarW / 200) * 0.6 +
    (input.dailyAh / 100) * 0.4 +
    (input.inverterSize > 0 ? 1 : 0) * 0.8 +
    (input.dcDcChargerSize > 0 ? 1 : 0) * 0.5;

  const timeHoursSaved = Math.round((24 + complexity * 8) * 10) / 10;
  const wasteCostAvoided = Math.round((120 + complexity * 75) * 100) / 100;
  const confidenceScore = Math.max(70, Math.min(98, Math.round(78 + complexity * 4)));

  return { timeHoursSaved, wasteCostAvoided, confidenceScore };
}

