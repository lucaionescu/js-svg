import { palettes } from "../lib/palettes.js";
import { choice } from "../lib/random.js";
import { sketch } from "../lib/sketch.js";
import { SceneGraph } from "../lib/scene.js";

const draw = (params) => {
  const palette = palettes.get(params.palette);
  const scene = new SceneGraph();
  scene.addNode("rect", {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    fill: choice(palette),
  });
  return scene;
};

sketch(draw);
