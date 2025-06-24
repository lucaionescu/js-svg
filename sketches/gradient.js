import { palettes } from "../lib/palettes.js";
import { sketch } from "../lib/sketch.js";
import { SceneGraph } from "../lib/scene.js";
import { shuffle } from "../lib/random.js";

const params = {
  gradient: "linear",
};

const bindings = {
  gradient: {
    options: {
      linear: "linear",
      radial: "radial",
    },
  },
};

const draw = (params) => {
  const palette = shuffle(palettes.get(params.palette));

  const scene = new SceneGraph();
  const defs = scene.addNode("defs");

  const gradient = scene.addNode(
    `${params.gradient}Gradient`,
    { id: "grad", x1: 0, x2: 1, y1: 0, y2: 1 },
    "grad",
    defs
  );

  for (let i = 0; i < palette.length; i++) {
    scene.addNode(
      "stop",
      { offset: (i + 1) / palette.length, "stop-color": palette[i] },
      null,
      gradient
    );
  }

  scene.addNode("rect", { width: 1, height: 1, fill: "url(#grad)" });

  return scene;
};

sketch(draw, params, bindings);
