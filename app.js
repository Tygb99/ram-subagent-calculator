import { calculateRecommendation, PRESETS } from './calculator.mjs';
import { fetchGitHubStars } from './github-stats.mjs';

const elements = {
  ramRange: document.querySelector('#ram-range'),
  ramNumber: document.querySelector('#ram-number'),
  ramError: document.querySelector('#ram-error'),
  reserveRange: document.querySelector('#reserve-range'),
  reserveNumber: document.querySelector('#reserve-number'),
  reserveError: document.querySelector('#reserve-error'),
  detectButton: document.querySelector('#detect-ram'),
  detectStatus: document.querySelector('#detect-status'),
  autoReserveButton: document.querySelector('#auto-reserve'),
  resetButton: document.querySelector('#reset-calculator'),
  copyButton: document.querySelector('#copy-result'),
  copyStatus: document.querySelector('#copy-status'),
  resultTitle: document.querySelector('#result-title'),
  recommended: document.querySelector('#recommended-count'),
  safe: document.querySelector('#safe-count'),
  balanced: document.querySelector('#balanced-count'),
  maximum: document.querySelector('#maximum-count'),
  extremeCount: document.querySelector('#extreme-count'),
  extremeSwap: document.querySelector('#extreme-swap'),
  extremeCombined: document.querySelector('#extreme-combined'),
  resultSummary: document.querySelector('#result-summary'),
  presetBadge: document.querySelector('#preset-badge'),
  equationTotal: document.querySelector('#equation-total'),
  equationReserve: document.querySelector('#equation-reserve'),
  equationMain: document.querySelector('#equation-main'),
  equationPool: document.querySelector('#equation-pool'),
  detailPerAgent: document.querySelector('#detail-per-agent'),
  githubLink: document.querySelector('#github-link'),
  githubStars: document.querySelector('#github-stars'),
  githubStarCount: document.querySelector('#github-star-count'),
};

const presetInputs = [...document.querySelectorAll('input[name="preset"]')];
let reserveIsAutomatic = true;
let latestResult = null;

function selectedPreset() {
  return presetInputs.find((input) => input.checked)?.value ?? 'balanced';
}

function formatGb(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function automaticReserve(totalRam, preset = selectedPreset()) {
  return calculateRecommendation(totalRam, preset).reserveGb;
}

function setValidity(input, error, isValid) {
  input.setAttribute('aria-invalid', String(!isValid));
  error.hidden = isValid;
}

function clearResult() {
  latestResult = null;
  elements.resultTitle.textContent = '입력 확인';
  elements.recommended.textContent = '—';
  elements.safe.textContent = '—';
  elements.balanced.textContent = '—';
  elements.maximum.textContent = '—';
  elements.extremeCount.textContent = '—';
  elements.extremeSwap.textContent = '—';
  elements.extremeCombined.textContent = '—';
  elements.equationTotal.textContent = '—';
  elements.equationReserve.textContent = '—';
  elements.equationMain.textContent = '—';
  elements.equationPool.textContent = '—';
  elements.detailPerAgent.textContent = '—';
  elements.resultSummary.textContent = 'RAM과 시스템 여유분을 확인하면 다시 계산합니다.';
  elements.copyButton.disabled = true;
}

function render() {
  const ramValid = elements.ramNumber.validity.valid && elements.ramNumber.value !== '';
  const reserveValid = elements.reserveNumber.validity.valid && elements.reserveNumber.value !== '';
  setValidity(elements.ramNumber, elements.ramError, ramValid);
  elements.ramRange.setAttribute('aria-invalid', String(!ramValid));
  setValidity(elements.reserveNumber, elements.reserveError, reserveValid);
  elements.reserveRange.setAttribute('aria-invalid', String(!reserveValid));

  if (!ramValid || !reserveValid) {
    clearResult();
    return;
  }

  latestResult = calculateRecommendation(elements.ramNumber.value, selectedPreset(), {
    reserveGb: Number(elements.reserveNumber.value),
  });

  const preset = PRESETS[latestResult.preset];
  const hasCapacity = latestResult.balanced > 0;
  elements.resultTitle.textContent = hasCapacity ? '안전 동시 실행' : '메모리 부족';
  elements.recommended.textContent = String(latestResult.balanced);
  elements.safe.textContent = String(latestResult.safe);
  elements.balanced.textContent = String(latestResult.balanced);
  elements.maximum.textContent = String(latestResult.maximum);
  elements.resultSummary.textContent = hasCapacity
    ? '메모리 부담이 있는 작업을 동시에 실행할 때의 균형 권장값입니다.'
    : '시스템과 메인 에이전트용 RAM을 확보하면 병렬 실행 여유가 남지 않습니다.';
  elements.presetBadge.textContent = `${preset.label} · ${formatGb(preset.perAgentGb)} GB`;
  elements.equationTotal.textContent = formatGb(latestResult.totalRamGb);
  elements.equationReserve.textContent = formatGb(latestResult.reserveGb);
  elements.equationMain.textContent = formatGb(latestResult.mainAgentGb);
  elements.equationPool.textContent = formatGb(latestResult.poolGb);
  elements.detailPerAgent.textContent = `${latestResult.perAgentGb.toFixed(1)} GB`;
  elements.extremeCount.textContent = String(latestResult.extreme.accumulatedAgents);
  elements.extremeSwap.textContent = `${formatGb(latestResult.extreme.estimatedSwapGb)} GB`;
  elements.extremeCombined.textContent = `${formatGb(latestResult.extreme.estimatedCombinedMemoryGb)} GB`;
  elements.copyButton.disabled = false;
}

function syncTotalFromRange() {
  elements.ramNumber.value = elements.ramRange.value;
  const totalRam = Number(elements.ramRange.value);
  elements.reserveRange.max = String(totalRam);
  elements.reserveNumber.max = String(totalRam);
  if (reserveIsAutomatic) {
    const reserve = automaticReserve(totalRam);
    elements.reserveRange.value = String(reserve);
    elements.reserveNumber.value = String(reserve);
  } else if (Number(elements.reserveNumber.value) > totalRam) {
    elements.reserveRange.value = String(totalRam);
    elements.reserveNumber.value = String(totalRam);
  }
  render();
}

function syncTotalFromNumber() {
  const isValid = elements.ramNumber.validity.valid && elements.ramNumber.value !== '';
  if (isValid) {
    const totalRam = Number(elements.ramNumber.value);
    elements.ramRange.value = String(totalRam);
    elements.reserveRange.max = String(totalRam);
    elements.reserveNumber.max = String(totalRam);
    if (reserveIsAutomatic) {
      const reserve = automaticReserve(totalRam);
      elements.reserveRange.value = String(reserve);
      elements.reserveNumber.value = String(reserve);
    }
  }
  render();
}

function setManualReserve(value) {
  reserveIsAutomatic = false;
  elements.reserveRange.value = value;
  elements.reserveNumber.value = value;
  render();
}

function restoreAutomaticReserve() {
  if (!elements.ramNumber.validity.valid || elements.ramNumber.value === '') {
    return;
  }
  reserveIsAutomatic = true;
  const reserve = automaticReserve(Number(elements.ramNumber.value));
  elements.reserveRange.value = String(reserve);
  elements.reserveNumber.value = String(reserve);
  render();
}

function detectRam() {
  const detected = navigator.deviceMemory;
  if (!Number.isFinite(detected)) {
    elements.detectStatus.textContent = '이 브라우저는 RAM 감지를 제공하지 않습니다. 시스템 정보의 값을 직접 입력해 주세요.';
    return;
  }

  const normalized = Math.min(2048, Math.max(4, Math.round(detected / 4) * 4));
  elements.ramRange.value = String(normalized);
  elements.ramNumber.value = String(normalized);
  elements.detectStatus.textContent = `브라우저가 약 ${detected}GB로 알려줬습니다. 정확한 값과 다르면 직접 수정하세요.`;
  reserveIsAutomatic = true;
  syncTotalFromNumber();
}

function copyText() {
  if (!latestResult) {
    return '';
  }
  const preset = PRESETS[latestResult.preset];
  return [
    `AgentFit RAM 계산 결과`,
    `전체 RAM: ${formatGb(latestResult.totalRamGb)} GB`,
    `작업 강도: ${preset.label} (에이전트당 ${formatGb(latestResult.perAgentGb)} GB)`,
    `안전 동시 ${latestResult.safe}개 / 균형 동시 ${latestResult.balanced}개 / 메모리 상한 ${latestResult.maximum}개`,
    `극한 누적 추정: ${latestResult.extreme.accumulatedAgents}개 (RAM+스왑 ${formatGb(latestResult.extreme.estimatedCombinedMemoryGb)} GB)`,
    `시스템 여유분: ${formatGb(latestResult.reserveGb)} GB`,
    `https://tygb99.github.io/ram-subagent-calculator/`,
  ].join('\n');
}

async function copyResult() {
  const text = copyText();
  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    elements.copyStatus.textContent = '결과를 복사했습니다.';
  } catch {
    elements.copyStatus.textContent = '복사하지 못했습니다. 브라우저 권한을 확인해 주세요.';
  }
}

function resetCalculator() {
  elements.ramRange.value = '24';
  elements.ramNumber.value = '24';
  elements.reserveRange.max = '24';
  elements.reserveNumber.max = '24';
  document.querySelector('#preset-balanced').checked = true;
  elements.detectStatus.textContent = '';
  elements.copyStatus.textContent = '';
  reserveIsAutomatic = true;
  restoreAutomaticReserve();
}

elements.ramRange.addEventListener('input', syncTotalFromRange);
elements.ramNumber.addEventListener('input', syncTotalFromNumber);
elements.reserveRange.addEventListener('input', () => setManualReserve(elements.reserveRange.value));
elements.reserveNumber.addEventListener('input', () => {
  reserveIsAutomatic = false;
  const valid = elements.reserveNumber.validity.valid && elements.reserveNumber.value !== '';
  if (valid) {
    elements.reserveRange.value = elements.reserveNumber.value;
  }
  render();
});
presetInputs.forEach((input) => input.addEventListener('change', render));
elements.detectButton.addEventListener('click', detectRam);
elements.autoReserveButton.addEventListener('click', restoreAutomaticReserve);
elements.resetButton.addEventListener('click', resetCalculator);
elements.copyButton.addEventListener('click', copyResult);

render();
fetchGitHubStars().then((stars) => {
  if (stars === null) return;
  elements.githubStarCount.textContent = stars.toLocaleString('ko-KR');
  elements.githubStars.hidden = false;
  elements.githubLink.setAttribute('aria-label', `GitHub 저장소, 스타 ${stars}개`);
});
