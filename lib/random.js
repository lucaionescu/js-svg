let newSeed = () => {
  let seed = "0x";
  const chars = "0123456789abcdef";
  for (let t = 64; 0 < t; --t) {
    seed += chars[~~(16 * Math.random())];
  }
  return seed;
};

let getState = () => {
  return Uint32Array.from(
    [0, 0, 0, 0].map((_, i) => parseInt(seed.substr(i * 8 + 2, 8), 16))
  );
};

let seed = newSeed();
let xsState = getState();

const getSeed = () => {
  return seed;
};

const setNewSeed = (h = null) => {
  if (h === null) {
    seed = newSeed();
  } else {
    seed = h;
  }
  xsState = getState();
  return seed;
};

const prng = () => {
  let s,
    t = xsState[3];
  xsState[3] = xsState[2];
  xsState[2] = xsState[1];
  xsState[1] = s = xsState[0];
  t ^= t << 11;
  t ^= t >>> 8;
  xsState[0] = t ^ s ^ (s >>> 19);
  return xsState[0] / 0x100000000;
};

const range = (a = undefined, b = undefined) => {
  if (a === undefined && b === undefined) {
    return prng();
  }
  if (b === undefined) {
    b = a;
    a = 0;
  }
  return a + (b - a) * prng();
};

const randVec2 = () => {
  return [range(), range()];
};

const randVec3 = () => {
  return [range(), range(), range()];
};

const rangeFloor = (a, b) => ~~range(a, b);

const choice = (arr) => arr[~~(arr.length * prng())];

const pickN = (arr, n) => {
  const shuffled = shuffle(arr);
  return shuffled.slice(0, n);
};

const bool = () => prng() < 0.5;

const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = ~~(prng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export {
  getSeed,
  setNewSeed,
  pickN,
  prng,
  range,
  rangeFloor,
  choice,
  bool,
  shuffle,
  randVec2,
  randVec3,
};
