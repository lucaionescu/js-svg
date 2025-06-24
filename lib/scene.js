class SceneNode {
  constructor(type, attributes = {}, id = null) {
    this.type = type;
    this.attributes = attributes;
    this.children = [];
    this.id = id;
    this.parent = null;
  }

  addChild(child) {
    child.parent = this;
    this.children.push(child);
  }
}

class SceneGraph {
  constructor(
    attributes = { viewBox: "0 0 1 1", preserveAspectRatio: "xMidYMid meet" }
  ) {
    this.root = new SceneNode("svg", attributes, "root");
    this.lookup = new Map();
  }

  addNode(type, attributes = {}, id = null, parent = this.root) {
    const node = new SceneNode(type, attributes, id);
    parent.addChild(node);
    if (id) this.lookup.set(id, node);
    return node;
  }

  getNodeById(id) {
    return this.lookup.get(id);
  }

  traverse(callback, node = this.root) {
    callback(node);
    for (const child of node.children) {
      this.traverse(callback, child);
    }
  }
}

export { SceneNode, SceneGraph };
