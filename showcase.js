import { calculateRecommendation } from './calculator.mjs';

const ramRange = document.querySelector('#ram-range');
const ramNumber = document.querySelector('#ram-number');
const ramError = document.querySelector('#ram-error');
const presetInputs = [...document.querySelectorAll('input[name="preset"]')];

const output = {
  count: document.querySelector('#result-number'),
  label: document.querySelector('#result-label'),
  summary: document.querySelector('#result-summary'),
  total: document.querySelector('#detail-total'),
  reserve: document.querySelector('#detail-reserve'),
  main: document.querySelector('#detail-main'),
  pool: document.querySelector('#detail-pool'),
  extremeCount: document.querySelector('#showcase-extreme-count'),
  extremeSwap: document.querySelector('#showcase-extreme-swap'),
  extremeCombined: document.querySelector('#showcase-extreme-combined'),
};

function formatGb(value) {
  return `${value.toFixed(1)} GB`;
}

function selectedPreset() {
  return presetInputs.find((input) => input.checked)?.value ?? 'balanced';
}

function render() {
  const totalRam = Number(ramNumber.value);
  const isValid = Number.isFinite(totalRam) && ramNumber.validity.valid;
  ramNumber.setAttribute('aria-invalid', String(!isValid));
  ramRange.setAttribute('aria-invalid', String(!isValid));
  ramError.hidden = isValid;

  if (!isValid) {
    output.count.textContent = '—';
    output.label.textContent = '입력 확인';
    output.summary.textContent = 'RAM 값을 수정하면 권장 개수를 다시 계산합니다.';
    output.total.textContent = '—';
    output.reserve.textContent = '—';
    output.main.textContent = '—';
    output.pool.textContent = '—';
    output.extremeCount.textContent = '—';
    output.extremeSwap.textContent = '—';
    output.extremeCombined.textContent = '—';
    return;
  }

  const result = calculateRecommendation(totalRam, selectedPreset());
  output.count.textContent = String(result.balanced);
  output.label.textContent = result.balanced > 0 ? '균형 추천' : '메모리 부족';
  output.summary.innerHTML = '일상 작업과 <span class="keep-together">갑작스러운 메모리 증가 사이에</span> <span class="keep-together">여유를 둔 권장값입니다.</span>';
  output.total.textContent = formatGb(totalRam);
  output.reserve.textContent = `-${formatGb(result.reserveGb)}`;
  output.main.textContent = `-${formatGb(result.mainAgentGb)}`;
  output.pool.textContent = formatGb(result.poolGb);
  output.extremeCount.textContent = String(result.extreme.accumulatedAgents);
  output.extremeSwap.textContent = formatGb(result.extreme.estimatedSwapGb);
  output.extremeCombined.textContent = formatGb(result.extreme.estimatedCombinedMemoryGb);
}

ramRange.addEventListener('input', () => {
  ramNumber.value = ramRange.value;
  render();
});

ramNumber.addEventListener('input', () => {
  const value = Number(ramNumber.value);
  if (Number.isFinite(value) && ramNumber.validity.valid) {
    ramRange.value = String(value);
  }
  render();
});

presetInputs.forEach((input) => input.addEventListener('change', render));
render();
