export const PRESETS = Object.freeze({
  light: Object.freeze({ label: '가벼움', perAgentGb: 1 }),
  balanced: Object.freeze({ label: '균형', perAgentGb: 2 }),
  heavy: Object.freeze({ label: '무거움', perAgentGb: 4 }),
});

export function parseRamInput(value) {
  if (typeof value === 'string' && value.trim() === '') {
    throw new RangeError('RAM is required.');
  }

  const ram = Number(value);
  if (!Number.isFinite(ram) || ram < 4 || ram > 256 || ram % 4 !== 0) {
    throw new RangeError('RAM must be between 4 and 256 GB in 4 GB steps.');
  }

  return ram;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function scaledCount(maximum, ratio) {
  return maximum === 0 ? 0 : Math.max(1, Math.floor(maximum * ratio));
}

export function calculateRecommendation(totalRamInput, preset = 'balanced', options = {}) {
  const totalRamGb = parseRamInput(totalRamInput);
  const presetConfig = PRESETS[preset];
  if (!presetConfig) {
    throw new RangeError('Unknown workload preset.');
  }

  const automaticReserve = clamp(totalRamGb * 0.25, 3, 16);
  const reserveGb = options.reserveGb ?? automaticReserve;
  if (!Number.isFinite(reserveGb) || reserveGb < 0 || reserveGb > totalRamGb) {
    throw new RangeError('System reserve must fit within total RAM.');
  }

  const mainAgentGb = presetConfig.perAgentGb;
  const poolGb = Math.max(0, totalRamGb - reserveGb - mainAgentGb);
  const maximum = Math.floor(poolGb / presetConfig.perAgentGb);

  return {
    totalRamGb,
    preset,
    perAgentGb: presetConfig.perAgentGb,
    reserveGb,
    mainAgentGb,
    poolGb,
    safe: scaledCount(maximum, 0.65),
    balanced: scaledCount(maximum, 0.85),
    maximum,
  };
}
