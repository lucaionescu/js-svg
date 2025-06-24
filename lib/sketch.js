import { palettesOptions } from "./palettes.js";
import { initPane, importState, exportState, getCurrentPane } from "./pane.js";
import { getSeed, setNewSeed } from "./random.js";
import { debounce } from "./utils.js";

// ============================================================================
// CONFIGURATION AND CONSTANTS
// ============================================================================

const CONFIG = {
  windowId: "window",
  sketchContainerId: "sketch-container",
  rootSvg: "root-svg",
  ns: "http://www.w3.org/2000/svg",
  debounceDelay: 100,
  containerSizeRatio: 0.95,
};

const isDarkMode = () => {
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
};

const createDefaultParams = () => ({
  palette: "000",
  background: isDarkMode() ? "black" : "white",
  drawOnChange: true,
});

const createDefaultBindings = () => ({
  palette: {
    label: "Palette",
    options: palettesOptions,
  },
  background: {
    label: "Background",
    options: {
      white: "white",
      black: "black",
      grey: "grey",
      darkgrey: "darkgrey",
      ivory: "ivory",
      linen: "linen",
    },
  },
  drawOnChange: {
    label: "Automatic redraw",
  },
});

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

let globalParams = createDefaultParams();
let globalBindings = createDefaultBindings();
let callbacks = {};
let currentRedrawing = false;
let currentBackgroundColor = null;
let cachedContainerSize = null;
let lastWindowDimensions = { width: 0, height: 0 };

const updateParams = (newParams) => {
  Object.assign(globalParams, newParams);
  updateBackgroundColor();
};

const updateBindings = (newBindings) => {
  Object.assign(globalBindings, newBindings);
};

const setCallbacks = (newCallbacks) => {
  callbacks = newCallbacks;
};

// ============================================================================
// URL AND BROWSER HISTORY MANAGEMENT
// ============================================================================

const serializeStateToUrl = (seed) => {
  const url = new URL(window.location.href);
  url.searchParams.set("seed", seed);

  const pane = getCurrentPane();
  if (pane) {
    const state = exportState();
    url.searchParams.set("state", JSON.stringify(state));
  }

  return url;
};

const deserializeStateFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const stateParam = urlParams.get("state");

  if (stateParam) {
    try {
      return JSON.parse(stateParam);
    } catch (e) {
      console.warn("Failed to parse state from URL:", e);
    }
  }

  return null;
};

const updateHistoryState = (seed, replaceState = false) => {
  const url = serializeStateToUrl(seed);
  const paneState = exportState();
  const historyState = { seed, paneState };

  if (replaceState) {
    history.replaceState(historyState, "", url.toString());
  } else {
    history.pushState(historyState, "", url.toString());
  }

  updateDocumentTitle(seed);
};

const updateDocumentTitle = (seed) => {
  document.title = `${document.title.split(" - ")[0]} - ${seed}`;
};

const restoreStateAndDraw = () => {
  if (currentRedrawing) return;
  currentRedrawing = true;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    let seed = urlParams.get("seed");
    const pane = getCurrentPane();

    if (history.state) {
      seed = history.state.seed;
      if (history.state.paneState && pane) {
        importState(history.state.paneState);
        updateBackgroundColor();
      }
    } else {
      const restoredState = deserializeStateFromUrl();
      if (restoredState && pane) {
        importState(restoredState);
        updateBackgroundColor();
      }
    }

    if (seed) {
      setNewSeed(seed);
      document.title = seed;
    }

    if (callbacks.render) {
      callbacks.render();
    }
  } finally {
    currentRedrawing = false;
  }
};

const initializeStateFromUrl = () => {
  const restoredState = deserializeStateFromUrl();
  if (restoredState) {
    return restoredState;
  }
  return null;
};

// ============================================================================
// DOM MANAGEMENT
// ============================================================================

const getContainer = () => {
  return document.getElementById(CONFIG.sketchContainerId);
};

const updateBackgroundColor = () => {
  const newBackground = globalParams.background;
  if (currentBackgroundColor !== newBackground) {
    document.getElementById(CONFIG.windowId).style.background = newBackground;
    currentBackgroundColor = newBackground;
  }
};

const calculateContainerSize = () => {
  return Math.min(
    window.innerWidth * CONFIG.containerSizeRatio,
    window.innerHeight * CONFIG.containerSizeRatio
  );
};

const hasWindowSizeChanged = () => {
  return (
    lastWindowDimensions.width !== window.innerWidth ||
    lastWindowDimensions.height !== window.innerHeight
  );
};

const updateWindowDimensions = () => {
  lastWindowDimensions.width = window.innerWidth;
  lastWindowDimensions.height = window.innerHeight;
};

const resizeContainer = (force = false) => {
  if (!force && !hasWindowSizeChanged() && cachedContainerSize !== null) {
    return;
  }

  const container = getContainer();
  const size = calculateContainerSize();

  if (cachedContainerSize !== size || force) {
    container.style.width = `${size}px`;
    container.style.height = `${size}px`;
    cachedContainerSize = size;
    updateWindowDimensions();
  }
};

const createSVGElement = (type) => {
  return document.createElementNS(CONFIG.ns, type);
};

const getRootSvg = () => {
  let svg = document.getElementById(CONFIG.rootSvg);

  if (!svg) {
    const container = getContainer();
    svg = createSVGElement("svg");
    svg.setAttribute("id", CONFIG.rootSvg);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    container.appendChild(svg);
  }

  return svg;
};

const setupInitialLayout = () => {
  const container = getContainer();
  resizeContainer();
  updateBackgroundColor();
  return container;
};

// ============================================================================
// FILE OPERATIONS
// ============================================================================

const saveSketchAsSVG = () => {
  const svg = document.getElementById(CONFIG.rootSvg);
  const serializer = new XMLSerializer();
  const svgBlob = new Blob([serializer.serializeToString(svg)], {
    type: "image/svg+xml;charset=utf-8",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(svgBlob);
  link.download = `${getSeed()}.svg`;
  link.click();
  URL.revokeObjectURL(link.href);
};

// ============================================================================
// RENDERING SYSTEM
// ============================================================================

const renderScene = (userDrawCallback) => {
  const rootSvg = getRootSvg();
  rootSvg.innerHTML = "";

  const scene = userDrawCallback(globalParams);

  scene.traverse((node) => {
    const el = node.type !== "svg" ? createSVGElement(node.type) : getRootSvg();

    Object.entries(node.attributes).forEach(([key, value]) => {
      el.setAttribute(key, value);
    });

    node._el = el;
    if (node.parent) {
      node.parent._el.appendChild(el);
    } else if (node.type !== "svg") {
      getRootSvg().appendChild(el);
    }
  });
};

const drawSketch = (userDrawCallback) => {
  if (currentRedrawing) return;

  const urlParams = new URLSearchParams(window.location.search);
  let urlSeed = urlParams.get("seed");

  if (urlSeed) {
    setNewSeed(urlSeed);
  } else {
    const newSeed = setNewSeed();
    updateHistoryState(newSeed, true);
  }

  renderScene(userDrawCallback);
};

// ============================================================================
// CALLBACK FUNCTIONS
// ============================================================================

const createCallbacksObject = (render, draw) => ({
  draw,
  render,
  save: saveSketchAsSVG,
  newSeed: () => {
    const seed = setNewSeed();
    updateHistoryState(seed);
  },
  onParamsChange: () => {
    const seed = getSeed();
    updateHistoryState(seed);
  },
  home: () => {
    window.location.href = "/";
  },
});

// ============================================================================
// EVENT HANDLERS
// ============================================================================

const setupEventListeners = (container) => {
  window.addEventListener("popstate", restoreStateAndDraw);
  window.addEventListener(
    "resize",
    debounce(resizeContainer, CONFIG.debounceDelay)
  );

  container.addEventListener("touchstart", () => {
    callbacks.newSeed();
    callbacks.draw();
  });

  document.addEventListener("keydown", (event) => {
    const keyActions = {
      s: () => callbacks.save(),
      n: () => {
        callbacks.newSeed();
        callbacks.draw();
      },
      h: () => callbacks.home(),
    };

    const action = keyActions[event.key];
    if (action) {
      action();
    }
  });
};

// ============================================================================
// MAIN SKETCH FUNCTION
// ============================================================================

const sketch = (userDrawCallback, params = {}, bindings = {}) => {
  const render = () => renderScene(userDrawCallback);
  const draw = () => drawSketch(userDrawCallback);

  const callbacksObject = createCallbacksObject(render, draw);
  setCallbacks(callbacksObject);

  updateParams(params);
  updateBindings(bindings);
  const initialState = initializeStateFromUrl();

  initPane(globalParams, globalBindings, callbacks);

  if (initialState) {
    importState(initialState);
    updateBackgroundColor();
  }

  const container = setupInitialLayout();
  setupEventListeners(container);

  draw();
};

export { sketch };
