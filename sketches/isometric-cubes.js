import { palettes } from "../lib/palettes.js";
import { sketch } from "../lib/sketch.js";
import { SceneGraph } from "../lib/scene.js";
import { choice, range, rangeFloor, prng } from "../lib/random.js";

const params = {
  palette: "000",
  sizeVariance: 0.2,
  sizeMultiplier: 1,
  faceProbability: 0.4,
  fillProbability: 0.2,
  strokeProbability: 0.2,
  numCubes: 100,
  pov: { x: 0, y: 1, z: 1 },
  maxStrokeWidth: 0.005,
  strokeVariance: 0.002,
  strokeCount: 3,
  transformRange: { x: 0.01, y: 0.01 },
};

const bindings = {
  fillProbability: {
    min: 0,
    max: 1,
    step: 0.01,
  },
  strokeProbability: {
    min: 0,
    max: 1,
    step: 0.01,
  },
  faceProbability: {
    min: 0,
    max: 1,
    step: 0.01,
  },
  numCubes: {
    min: 1,
    max: 1000,
    step: 1,
  },
  maxStrokeWidth: {
    min: 0,
    max: 0.02,
    step: 0.001,
  },
  pov: {
    label: "POV",
    x: { min: -2, max: 2, step: 0.1 },
    y: { min: -2, max: 2, step: 0.1 },
    z: { min: -2, max: 2, step: 0.1 },
  },
  sizeVariance: {
    min: 0.001,
    max: 2,
    step: 0.01,
  },
  sizeMultiplier: {
    min: 1,
    max: 10,
    step: 0.1,
  },
  strokeVariance: {
    min: 0.0001,
    max: 0.01,
    step: 0.0001,
  },
  strokeCount: {
    min: 1,
    max: 10,
    step: 1,
  },
  transformRange: {
    x: { min: 0, max: 0.05, step: 0.001 },
    y: { min: 0, max: 0.05, step: 0.001 },
  },
};

const applySharpieEffect = (points, variance) => {
  return points.map((point) => [
    point[0] + (range(1.0) * variance * 2 - variance),
    point[1] + (range(1.0) * variance * 2 - variance),
  ]);
};

const newCube = (x, y, s, faceProbability, pov) => {
  const topPoints = [
    [x, y - (s / 2) * pov.y], // Adjusted for vertical POV
    [x + s / 2, y - (s / 4) * pov.y], // Adjusted for vertical POV
    [x, y], // Front center
    [x - s / 2, y - (s / 4) * pov.y], // Adjusted for vertical POV
  ];

  // Adjust for horizontal rotation and depth perception
  const horizontalOffset = (s / 2) * pov.x;
  const depthOffset = (s / 2) * pov.z; // New depth adjustment

  const bottomPoints = [
    [topPoints[0][0] + horizontalOffset, topPoints[0][1] + depthOffset], // Bottom center
    [topPoints[1][0] + horizontalOffset, topPoints[1][1] + depthOffset], // Bottom right
    [topPoints[2][0] + horizontalOffset, topPoints[2][1] + depthOffset], // Bottom front
    [topPoints[3][0] + horizontalOffset, topPoints[3][1] + depthOffset], // Bottom left
  ];

  const faces = [];

  // Draw top face
  if (range(1.0) < faceProbability) {
    faces.push(topPoints);
  }

  // Draw left face
  if (range(1.0) < faceProbability) {
    faces.push([topPoints[0], topPoints[3], bottomPoints[3], bottomPoints[0]]);
  }

  // Draw right face
  if (range(1.0) < faceProbability) {
    faces.push([topPoints[0], topPoints[1], bottomPoints[1], bottomPoints[0]]);
  }

  // Draw bottom face
  if (range(1.0) < faceProbability) {
    faces.push(bottomPoints);
  }

  return faces;
};

const isFaceWithinCanvas = (face) => {
  return face.every(
    (point) => point[0] >= 0 && point[0] <= 1 && point[1] >= 0 && point[1] <= 1
  );
};

const draw = (params) => {
  const palette = palettes.get(params.palette);
  const scene = new SceneGraph();

  const defs = scene.addNode("defs");

  const patterns = [];
  for (let i = 0; i < 5; i++) {
    const pattern = scene.addNode(
      "pattern",
      {
        patternUnits: "objectBoundingBox",
        width: 1,
        height: 1,
        id: `pattern-${i}`,
      },
      null,
      defs
    );
    if (range(1.0) < params.fillProbability) {
      scene.addNode(
        "rect",
        { x: 0, y: 0, width: 1, height: 1, fill: choice(palette) },
        null,
        pattern
      );
    }
    if (range(1.0) < params.strokeProbability) {
      scene.addNode(
        "line",
        {
          x1: range(1),
          y1: range(1),
          x2: range(1),
          y2: range(1),
          stroke: "#151513",
          "stroke-opacity": range(0.9, 1.0),
          "stroke-width": range(params.maxStrokeWidth),
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
        },
        null,
        pattern
      );
    }

    patterns.push(pattern);
  }

  scene.addNode("rect", {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    fill: choice(palette),
  });

  const strokeCount = params.strokeVariance > 0 ? params.strokeCount : 1;

  for (let n = 0; n < params.numCubes; n++) {
    const size =
      range(-params.sizeVariance, params.sizeVariance) * params.sizeMultiplier;
    let isoX = range(-0.1, 1.1);
    let isoY = range(-0.1, 1.1);
    isoX = Math.round(isoX * 20) / 20;
    isoY = Math.round(isoY * 20) / 20;
    const faces = newCube(isoX, isoY, size, params.faceProbability, params.pov);

    const fillColor =
      prng() < params.fillProbability
        ? choice(palette)
        : `url(#pattern-${rangeFloor(patterns.length)})`;

    for (const face of faces) {
      if (isFaceWithinCanvas(face)) {
        for (let i = 0; i < strokeCount; i++) {
          const messyPoints = applySharpieEffect(face, params.strokeVariance);
          const messyPointsStr = messyPoints
            .map((p) => `${p[0]},${p[1]}`)
            .join(" ");
          const strokeWidth = range(params.maxStrokeWidth);

          const dashArray = Array.from({ length: rangeFloor(0, 2) }, () =>
            range(0, 0.005)
          ).join(" ");

          const transformX =
            isoX +
            range(-params.transformRange.x, params.transformRange.x) -
            isoX;
          const transformY =
            isoY +
            range(-params.transformRange.y, params.transformRange.y) -
            isoY;

          scene.addNode("polygon", {
            points: messyPointsStr,
            fill: fillColor,
            stroke: "#151513",
            "stroke-width": strokeWidth,
            "stroke-opacity": range(0.9, 1.0),
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-dasharray": dashArray,
            "stroke-dashoffset": range(0, 0.005),
            transform: `translate(${transformX} ${transformY})`,
          });
        }
      }
    }
  }

  return scene;
};

sketch(draw, params, bindings);
