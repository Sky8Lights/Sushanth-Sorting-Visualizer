/* ============================================
   SORTING VISUALIZER - Core Logic
   Terminal/Hacker Theme
   ============================================ */

(() => {
  'use strict';

  // ============================================
  // Algorithm metadata
  // ============================================
  const ALGORITHMS = {
    bubble: {
      name: 'Bubble Sort',
      best: 'O(n)',
      avg: 'O(n²)',
      worst: 'O(n²)',
      space: 'O(1)',
      stable: 'YES',
      desc: 'Repeatedly compares adjacent elements and swaps them if they\'re in the wrong order. Simple but slow on large data.',
      pseudocode: [
        '// Bubble Sort',
        'procedure bubbleSort(A: list)',
        '  n = length(A)',
        '  for i from 0 to n-1:',
        '    swapped = false',
        '    for j from 0 to n-i-2:',
        '      if A[j] > A[j+1]:',
        '        swap(A[j], A[j+1])',
        '        swapped = true',
        '    if not swapped: break',
        '  return A',
      ],
    },
    selection: {
      name: 'Selection Sort',
      best: 'O(n²)',
      avg: 'O(n²)',
      worst: 'O(n²)',
      space: 'O(1)',
      stable: 'NO',
      desc: 'Finds the minimum element from the unsorted portion and places it at the beginning. Always does n² comparisons.',
      pseudocode: [
        '// Selection Sort',
        'procedure selectionSort(A: list)',
        '  n = length(A)',
        '  for i from 0 to n-2:',
        '    minIdx = i',
        '    for j from i+1 to n-1:',
        '      if A[j] < A[minIdx]:',
        '        minIdx = j',
        '    swap(A[i], A[minIdx])',
        '  return A',
      ],
    },
    insertion: {
      name: 'Insertion Sort',
      best: 'O(n)',
      avg: 'O(n²)',
      worst: 'O(n²)',
      space: 'O(1)',
      stable: 'YES',
      desc: 'Builds the sorted array one element at a time by inserting each new element into its correct position. Great for nearly-sorted data.',
      pseudocode: [
        '// Insertion Sort',
        'procedure insertionSort(A: list)',
        '  for i from 1 to n-1:',
        '    key = A[i]',
        '    j = i - 1',
        '    while j >= 0 and A[j] > key:',
        '      A[j+1] = A[j]',
        '      j = j - 1',
        '    A[j+1] = key',
        '  return A',
      ],
    },
    merge: {
      name: 'Merge Sort',
      best: 'O(n log n)',
      avg: 'O(n log n)',
      worst: 'O(n log n)',
      space: 'O(n)',
      stable: 'YES',
      desc: 'Divides the array in half, recursively sorts each half, then merges them back together. Predictable O(n log n) performance.',
      pseudocode: [
        '// Merge Sort',
        'procedure mergeSort(A, lo, hi):',
        '  if lo < hi:',
        '    mid = (lo + hi) / 2',
        '    mergeSort(A, lo, mid)',
        '    mergeSort(A, mid+1, hi)',
        '    merge(A, lo, mid, hi)',
        '',
        'procedure merge(A, lo, mid, hi):',
        '  // merge two sorted halves',
      ],
    },
    quick: {
      name: 'Quick Sort',
      best: 'O(n log n)',
      avg: 'O(n log n)',
      worst: 'O(n²)',
      space: 'O(log n)',
      stable: 'NO',
      desc: 'Picks a pivot element and partitions the array so smaller items are left and larger are right, then recurses on each side.',
      pseudocode: [
        '// Quick Sort',
        'procedure quickSort(A, lo, hi):',
        '  if lo < hi:',
        '    p = partition(A, lo, hi)',
        '    quickSort(A, lo, p-1)',
        '    quickSort(A, p+1, hi)',
        '',
        'procedure partition(A, lo, hi):',
        '  pivot = A[hi]',
        '  i = lo - 1',
        '  for j from lo to hi-1:',
        '    if A[j] <= pivot:',
        '      i++; swap(A[i], A[j])',
        '  swap(A[i+1], A[hi])',
        '  return i+1',
      ],
    },
  };

  // ============================================
  // State
  // ============================================
  const state = {
    array: [],
    size: 40,
    speed: 5,
    algorithm: 'bubble',
    isRunning: false,
    isPaused: false,
    shouldStop: false,
    comparisons: 0,
    swaps: 0,
    startTime: 0,
    elapsedTimer: null,
    sortedIndices: new Set(),
  };

  // ============================================
  // DOM References
  // ============================================
  const $ = (id) => document.getElementById(id);
  const dom = {
    algorithmSelect: $('algorithmSelect'),
    sizeSlider: $('sizeSlider'),
    speedSlider: $('speedSlider'),
    sizeValue: $('sizeValue'),
    speedValue: $('speedValue'),
    newArrayBtn: $('newArrayBtn'),
    startBtn: $('startBtn'),
    pauseBtn: $('pauseBtn'),
    resetBtn: $('resetBtn'),
    barsContainer: $('barsContainer'),
    comparisons: $('comparisons'),
    swaps: $('swaps'),
    elapsed: $('elapsed'),
    status: $('status'),
    algoName: $('algoName'),
    algoBest: $('algoBest'),
    algoAvg: $('algoAvg'),
    algoWorst: $('algoWorst'),
    algoSpace: $('algoSpace'),
    algoStable: $('algoStable'),
    algoDesc: $('algoDesc'),
    pseudocode: $('pseudocode'),
  };

  // ============================================
  // Utilities
  // ============================================
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Map speed slider (1..10) to delay (ms). Higher speed -> smaller delay.
  const getDelay = () => {
    const s = state.speed; // 1..10
    return Math.max(2, 220 - s * 22);
  };

  // Cooperative wait: yields control back to the loop and respects pause/stop.
  const tick = async () => {
    while (state.isPaused && !state.shouldStop) {
      await sleep(40);
    }
    if (state.shouldStop) throw new Error('__stopped__');
  };

  const formatNumber = (n, width = 4) => String(n).padStart(width, '0');

  // ============================================
  // Rendering
  // ============================================
  const renderBars = () => {
    const container = dom.barsContainer;
    container.innerHTML = '';
    const max = Math.max(...state.array, 1);
    const frag = document.createDocumentFragment();

    state.array.forEach((value, idx) => {
      const bar = document.createElement('div');
      bar.className = 'array-bar';
      if (state.sortedIndices.has(idx)) bar.classList.add('sorted');
      bar.style.height = `${(value / max) * 100}%`;
      frag.appendChild(bar);
    });

    container.appendChild(frag);
  };

  const updateBarHeights = () => {
    const bars = dom.barsContainer.children;
    const max = Math.max(...state.array, 1);
    for (let i = 0; i < state.array.length; i++) {
      bars[i].style.height = `${(state.array[i] / max) * 100}%`;
    }
  };

  const updateStats = () => {
    dom.comparisons.textContent = formatNumber(state.comparisons);
    dom.swaps.textContent = formatNumber(state.swaps);
  };

  const updateStatus = (text, cls = '') => {
    dom.status.textContent = `[ ${text} ]`;
    dom.status.className = `stat-value status ${cls}`;
  };

  const updateElapsed = () => {
    const seconds = (performance.now() - state.startTime) / 1000;
    dom.elapsed.textContent = `${seconds.toFixed(2)}s`;
  };

  const startElapsedTimer = () => {
    state.startTime = performance.now();
    state.elapsedTimer = setInterval(updateElapsed, 50);
  };

  const stopElapsedTimer = () => {
    if (state.elapsedTimer) {
      clearInterval(state.elapsedTimer);
      state.elapsedTimer = null;
    }
  };

  // Visual helpers
  const setBarClass = (idx, cls) => {
    const bar = dom.barsContainer.children[idx];
    if (!bar) return;
    bar.classList.add(cls);
  };

  const clearBarClass = (idx, cls) => {
    const bar = dom.barsContainer.children[idx];
    if (!bar) return;
    bar.classList.remove(cls);
  };

  const clearAllTransientClasses = () => {
    const bars = dom.barsContainer.children;
    for (let i = 0; i < bars.length; i++) {
      bars[i].classList.remove('comparing', 'swapping', 'pivot');
    }
  };

  const markSorted = (idx) => {
    state.sortedIndices.add(idx);
    const bar = dom.barsContainer.children[idx];
    if (bar) bar.classList.add('sorted');
  };

  // ============================================
  // Pseudocode highlighting
  // ============================================
  const renderPseudocode = () => {
    const lines = ALGORITHMS[state.algorithm].pseudocode;
    dom.pseudocode.innerHTML = lines
      .map((line, idx) => {
        const isComment = line.trim().startsWith('//');
        const cls = isComment ? 'code-line code-comment' : 'code-line';
        return `<span class="${cls}" data-line="${idx}">${escapeHtml(line) || '&nbsp;'}</span>`;
      })
      .join('');
  };

  const escapeHtml = (str) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const highlightLine = (idx) => {
    const spans = dom.pseudocode.querySelectorAll('.code-line');
    spans.forEach((s) => s.classList.remove('active'));
    if (idx == null) return;
    const target = dom.pseudocode.querySelector(`[data-line="${idx}"]`);
    if (target) {
      target.classList.add('active');
      target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };

  // ============================================
  // Algorithm primitives (instrumented)
  // ============================================
  const compare = async (i, j) => {
    await tick();
    state.comparisons++;
    updateStats();
    setBarClass(i, 'comparing');
    setBarClass(j, 'comparing');
    await sleep(getDelay());
    if (state.shouldStop) throw new Error('__stopped__');
    clearBarClass(i, 'comparing');
    clearBarClass(j, 'comparing');
    return state.array[i] - state.array[j];
  };

  const swap = async (i, j) => {
    await tick();
    setBarClass(i, 'swapping');
    setBarClass(j, 'swapping');
    [state.array[i], state.array[j]] = [state.array[j], state.array[i]];
    state.swaps++;
    updateStats();
    const bars = dom.barsContainer.children;
    const max = Math.max(...state.array, 1);
    bars[i].style.height = `${(state.array[i] / max) * 100}%`;
    bars[j].style.height = `${(state.array[j] / max) * 100}%`;
    await sleep(getDelay());
    if (state.shouldStop) throw new Error('__stopped__');
    clearBarClass(i, 'swapping');
    clearBarClass(j, 'swapping');
  };

  // ============================================
  // Algorithms
  // ============================================
  const algorithms = {
    bubble: async () => {
      const n = state.array.length;
      for (let i = 0; i < n - 1; i++) {
        highlightLine(2);
        let swapped = false;
        for (let j = 0; j < n - i - 1; j++) {
          highlightLine(4);
          const cmp = await compare(j, j + 1);
          if (state.shouldStop) throw new Error('__stopped__');
          if (cmp > 0) {
            highlightLine(5);
            await swap(j, j + 1);
            swapped = true;
          }
        }
        markSorted(n - i - 1);
        if (!swapped) {
          for (let k = 0; k < n - i - 1; k++) markSorted(k);
          break;
        }
      }
      markSorted(0);
    },

    selection: async () => {
      const n = state.array.length;
      for (let i = 0; i < n - 1; i++) {
        highlightLine(2);
        let minIdx = i;
        setBarClass(minIdx, 'pivot');
        for (let j = i + 1; j < n; j++) {
          highlightLine(4);
          const cmp = await compare(minIdx, j);
          if (state.shouldStop) throw new Error('__stopped__');
          if (cmp > 0) {
            clearBarClass(minIdx, 'pivot');
            minIdx = j;
            setBarClass(minIdx, 'pivot');
          }
        }
        highlightLine(6);
        clearBarClass(minIdx, 'pivot');
        if (minIdx !== i) await swap(i, minIdx);
        markSorted(i);
      }
      markSorted(n - 1);
    },

    insertion: async () => {
      const n = state.array.length;
      for (let i = 1; i < n; i++) {
        highlightLine(2);
        let j = i - 1;
        while (j >= 0) {
          highlightLine(4);
          const cmp = await compare(j, j + 1);
          if (state.shouldStop) throw new Error('__stopped__');
          if (cmp > 0) {
            highlightLine(5);
            await swap(j, j + 1);
            j--;
          } else {
            break;
          }
        }
      }
      for (let i = 0; i < n; i++) markSorted(i);
    },

    merge: async () => {
      const n = state.array.length;
      const aux = new Array(n);
      const merge = async (lo, mid, hi) => {
        for (let k = lo; k <= hi; k++) aux[k] = state.array[k];
        let i = lo, j = mid + 1;
        for (let k = lo; k <= hi; k++) {
          await tick();
          if (state.shouldStop) throw new Error('__stopped__');
          highlightLine(11);
          state.comparisons++;
          updateStats();
          if (i > mid) {
            state.array[k] = aux[j++];
          } else if (j > hi) {
            state.array[k] = aux[i++];
          } else {
            const cmp = aux[j] - aux[i];
            if (cmp < 0) {
              state.array[k] = aux[j++];
            } else {
              state.array[k] = aux[i++];
            }
          }
          const bar = dom.barsContainer.children[k];
          const max = Math.max(...state.array, 1);
          bar.style.height = `${(state.array[k] / max) * 100}%`;
          bar.classList.add('comparing');
          await sleep(getDelay());
          bar.classList.remove('comparing');
        }
      };

      const sort = async (lo, hi) => {
        if (lo >= hi) return;
        highlightLine(2);
        const mid = Math.floor((lo + hi) / 2);
        await sort(lo, mid);
        await sort(mid + 1, hi);
        await merge(lo, mid, hi);
      };

      await sort(0, n - 1);
      for (let i = 0; i < n; i++) markSorted(i);
    },

    quick: async () => {
      const n = state.array.length;
      const partition = async (lo, hi) => {
        highlightLine(10);
        setBarClass(hi, 'pivot');
        const pivot = state.array[hi];
        let i = lo - 1;
        for (let j = lo; j < hi; j++) {
          highlightLine(12);
          await tick();
          state.comparisons++;
          updateStats();
          setBarClass(j, 'comparing');
          await sleep(getDelay());
          if (state.shouldStop) throw new Error('__stopped__');
          clearBarClass(j, 'comparing');
          if (state.array[j] <= pivot) {
            i++;
            if (i !== j) {
              highlightLine(14);
              await swap(i, j);
            }
          }
        }
        clearBarClass(hi, 'pivot');
        highlightLine(15);
        if (i + 1 !== hi) await swap(i + 1, hi);
        return i + 1;
      };

      const sort = async (lo, hi) => {
        if (lo >= hi) {
          if (lo === hi) markSorted(lo);
          return;
        }
        highlightLine(2);
        const p = await partition(lo, hi);
        markSorted(p);
        await sort(lo, p - 1);
        await sort(p + 1, hi);
      };

      await sort(0, n - 1);
    },
  };

  // ============================================
  // Array generation
  // ============================================
  const generateArray = () => {
    state.array = Array.from({ length: state.size }, () =>
      Math.floor(Math.random() * 100) + 5
    );
    state.sortedIndices.clear();
    state.comparisons = 0;
    state.swaps = 0;
    updateStats();
    dom.elapsed.textContent = '0.00s';
    clearAllTransientClasses();
    renderBars();
    updateStatus('READY');
  };

  // ============================================
  // Algorithm info card
  // ============================================
  const updateAlgorithmInfo = () => {
    const algo = ALGORITHMS[state.algorithm];
    dom.algoName.textContent = algo.name;
    dom.algoBest.textContent = algo.best;
    dom.algoAvg.textContent = algo.avg;
    dom.algoWorst.textContent = algo.worst;
    dom.algoSpace.textContent = algo.space;
    dom.algoStable.textContent = algo.stable;
    dom.algoDesc.textContent = algo.desc;
  };

  // ============================================
  // Control state
  // ============================================
  const setRunningState = (running) => {
    state.isRunning = running;
    dom.startBtn.disabled = running;
    dom.pauseBtn.disabled = !running;
    dom.newArrayBtn.disabled = running;
    dom.algorithmSelect.disabled = running;
    dom.sizeSlider.disabled = running;
  };

  const setPausedState = (paused) => {
    state.isPaused = paused;
    dom.pauseBtn.textContent = paused ? '[ RESUME ]' : '[ PAUSE ]';
    if (paused) updateStatus('PAUSED', 'paused');
  };

  // ============================================
  // Run / Reset
  // ============================================
  const runSort = async () => {
    if (state.isRunning) return;
    state.shouldStop = false;
    state.isPaused = false;
    setRunningState(true);
    setPausedState(false);
    updateStatus('RUNNING', 'running');
    startElapsedTimer();
    highlightLine(null);

    try {
      await algorithms[state.algorithm]();
      if (state.shouldStop) {
        updateStatus('STOPPED', 'paused');
        return;
      }
      // Final celebratory sweep
      for (let i = 0; i < state.array.length; i++) {
        markSorted(i);
        await sleep(Math.min(15, getDelay() / 3));
      }
      updateStatus('DONE', 'done');
    } catch (err) {
      if (err.message !== '__stopped__') {
        console.error(err);
        updateStatus('ERROR', 'paused');
      } else {
        updateStatus('STOPPED', 'paused');
      }
    } finally {
      stopElapsedTimer();
      highlightLine(null);
      setRunningState(false);
      setPausedState(false);
    }
  };

  const resetSort = () => {
    state.shouldStop = true;
    state.isPaused = false;
    setPausedState(false);
    stopElapsedTimer();
    setRunningState(false);
    generateArray();
    highlightLine(null);
  };

  const togglePause = () => {
    if (!state.isRunning) return;
    setPausedState(!state.isPaused);
  };

  // ============================================
  // Event listeners
  // ============================================
  const init = () => {
    dom.algorithmSelect.addEventListener('change', (e) => {
      state.algorithm = e.target.value;
      updateAlgorithmInfo();
      renderPseudocode();
      highlightLine(null);
    });

    dom.sizeSlider.addEventListener('input', (e) => {
      state.size = Number(e.target.value);
      dom.sizeValue.textContent = state.size;
      if (!state.isRunning) generateArray();
    });

    dom.speedSlider.addEventListener('input', (e) => {
      state.speed = Number(e.target.value);
      dom.speedValue.textContent = state.speed;
    });

    dom.newArrayBtn.addEventListener('click', () => {
      if (state.isRunning) return;
      generateArray();
    });

    dom.startBtn.addEventListener('click', runSort);
    dom.pauseBtn.addEventListener('click', togglePause);
    dom.resetBtn.addEventListener('click', resetSort);

    // Initial render
    updateAlgorithmInfo();
    renderPseudocode();
    generateArray();
  };

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
