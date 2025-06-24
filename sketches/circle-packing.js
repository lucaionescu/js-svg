import { euclideanDistance } from "../lib/math.js";
import { palettes } from "../lib/palettes.js";
import { choice, range } from "../lib/random.js";
import { sketch } from "../lib/sketch.js";
import { SceneGraph } from "../lib/scene.js";

const params = {
  palette: "000",
  nColors: 5,
  maxAttempts: 1e4,
  containerRadius: 1,
  radius: { min: 1e-2, max: 1e-1 },
  depth: { min: 0, max: 10 },
};

const bindings = {
  nColors: { min: 1, max: 10, step: 1 },
  maxAttempts: { min: 1, max: 1e5, step: 100 },
  containerRadius: { min: 0.1, max: 2, step: 0.1 },
  radius: { min: 1e-5, max: 1, step: 1e-3 },
  depth: { min: 0, max: 10, step: 1 },
};

const recursiveCirclePacking = (
  container,
  maxAttempts,
  minRadius,
  maxRadius,
  depth,
  maxDepth
) => {
  const circles = [];
  const centerX = container.x;
  const centerY = container.y;
  const containerRadius = container.radius;

  const circleIntersects = (x, y, r) => {
    return circles.some(
      (circle) =>
        euclideanDistance([x, y], [circle.x, circle.y]) < r + circle.radius
    );
  };

  const addCircle = (x, y, radius) => {
    const newCircle = { x, y, radius };
    circles.push(newCircle);

    if (depth < maxDepth) {
      const children = recursiveCirclePacking(
        { x, y, radius },
        minRadius / 2,
        Math.min(maxRadius / 2, radius / 2),
        depth + 1,
        maxDepth
      );
      circles.push(...children);
    }
  };

  let attempts = 0;

  while (attempts < maxAttempts) {
    const radius = range(maxRadius - minRadius + minRadius);
    const angle = range(2 * Math.PI);
    const distance = range(containerRadius - radius);
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;

    if (
      euclideanDistance([x, y], [centerX, centerY]) + radius <=
        containerRadius &&
      !circleIntersects(x, y, radius)
    ) {
      addCircle(x, y, radius);
    }

    attempts++;
  }

  return circles;
};

const draw = (params) => {
  let palette = palettes.get(params.palette);

  const scene = new SceneGraph();

  scene.addNode(
    "rect",
    {
      id: "rect-0",
      width: 1,
      height: 1,
      fill: choice(palette),
    },
    "background"
  );

  palette = new Array(params.nColors).fill(0).map((_) => choice(palette));

  const container = { x: 0.5, y: 0.5, radius: params.containerRadius };
  const circles = recursiveCirclePacking(
    container,
    params.maxAttempts,
    params.radius.min,
    params.radius.max,
    params.depth.min,
    params.depth.max
  );

  for (let i = 0; i < circles.length; i++) {
    const c = circles[i];
    scene.addNode("circle", {
      id: `circle-${i}`,
      cx: c.x,
      cy: c.y,
      r: c.radius,
      fill: choice(palette),
      stroke: choice(palette),
      "stroke-width": 0,
    });
  }

  return scene;
};

sketch(draw, params, bindings);
