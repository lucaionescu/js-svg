const euclideanDistance = (a, b) => {
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
};

const lerp = (start, end, t) => {
  return start * (1 - t) + end * t;
};

const linspace = (start, stop, num, endpoint = true) => {
  if (num === 0) {
    return [];
  }

  if (num === 1) {
    return [start];
  }

  const step = (stop - start) / (endpoint ? num - 1 : num);
  const result = new Array(num);

  for (let i = 0; i < num; i++) {
    result[i] = start + i * step;
  }

  if (!endpoint) {
    result.pop();
  }

  return result;
};

const map = (value, min1, max1, min2, max2, clampResult = false) => {
  const result = ((value - min1) / (max1 - min1)) * (max2 - min2) + min2;
  return clampResult ? Math.max(min2, Math.min(result, max2)) : result;
};

const clamp01 = (value) => Math.max(0, Math.min(1, value));

export { clamp01, euclideanDistance, lerp, linspace, map };
