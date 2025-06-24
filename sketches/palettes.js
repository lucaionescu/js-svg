import { palettes } from "../lib/palettes.js";
import { sketch } from "../lib/sketch.js";
import { SceneGraph } from "../lib/scene.js";

const draw = (params) => {
  const scene = new SceneGraph();
  const rowHeight = 1 / palettes.size;

  palettes.forEach((palette, i) => {
    const rectWidth = 1 / palette.length;
    palette.forEach((color, j) => {
      scene.addNode("rect", {
        x: j * rectWidth,
        y: i * rowHeight,
        width: rectWidth,
        height: rowHeight,
        fill: color,
      });
    });
  });
  return scene;
};

sketch(draw);
