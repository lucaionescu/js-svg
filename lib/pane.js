import { Pane } from "tweakpane";
import * as EssentialsPlugin from "@tweakpane/plugin-essentials";
import { debounce } from "./utils.js";

let currentPane = null;

const initPane = (params, bindings, callbacks) => {
  if (currentPane) {
    currentPane.dispose();
  }

  const pane = new Pane({ title: "Settings" });
  pane.registerPlugin(EssentialsPlugin);

  currentPane = pane;

  const DEBOUNCE_DELAY = 500;

  const debouncedDrawCallback = debounce((params) => {
    callbacks.draw(params);
  }, DEBOUNCE_DELAY);

  const debouncedParamsChange = debounce(() => {
    if (callbacks.onParamsChange) {
      callbacks.onParamsChange();
    }
  }, DEBOUNCE_DELAY);

  Object.entries(params).forEach(([k, _]) => {
    const binding = bindings[k] || {};
    const control = pane.addBinding(params, k.toString(), binding);

    const isSlider = binding.min !== undefined && binding.max !== undefined;

    if (isSlider && params.drawOnChange) {
      control.on("change", () => {
        debouncedDrawCallback(params);
        debouncedParamsChange();
      });
    } else if (params.drawOnChange) {
      control.on("change", () => {
        callbacks.draw(params);
        if (callbacks.onParamsChange) {
          callbacks.onParamsChange();
        }
      });
    } else {
      control.on("change", () => {
        if (callbacks.onParamsChange) {
          callbacks.onParamsChange();
        }
      });
    }
  });

  if (!params.drawOnChange) {
    pane.on("change", () => {
      callbacks.draw(params);
      if (callbacks.onParamsChange) {
        callbacks.onParamsChange();
      }
    });
  }

  const newSeedButton = pane.addButton({
    title: "New seed (n)",
  });
  newSeedButton.on("click", () => {
    callbacks.newSeed();
    callbacks.draw(params);
  });

  const saveButton = pane.addButton({
    title: "Save (s)",
  });
  saveButton.on("click", callbacks.save);

  const homeButton = pane.addButton({
    title: "Home (h)",
  });
  homeButton.on("click", callbacks.home);

  return pane;
};

const refreshPane = () => {
  if (currentPane) {
    currentPane.refresh();
  }
};

const getCurrentPane = () => {
  return currentPane;
};

const importState = (state) => {
  if (currentPane) {
    currentPane.importState(state);
  }
};

const exportState = () => {
  if (currentPane) {
    return currentPane.exportState();
  }
  return null;
};

export { initPane, refreshPane, getCurrentPane, importState, exportState };
