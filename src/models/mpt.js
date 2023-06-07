const keccak256 = require('keccak256');

// MPT 节点类型
const NodeType = {
  BranchNode: 0,
  ExtensionNode: 1,
  LeafNode: 2
};

// MPT 节点类
class MPTNode {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }

  getHash() {
    if (!this.hash) {
      switch (this.type) {
        case NodeType.BranchNode:
          this.hash = this.calculateBranchHash();
          break;
        case NodeType.ExtensionNode:
          this.hash = this.calculateExtensionHash();
          break;
        case NodeType.LeafNode:
          this.hash = this.calculateLeafHash();
          break;
      }
    }
    return this.hash;
  }

  calculateBranchHash() {
    let hash = keccak256('');
    for (let i = 0; i < 16; i++) {
      let child = this.value[i];
      if (child) {
        hash = keccak256(hash + child.getHash());
      }
    }
    return hash;
  }

  calculateExtensionHash() {
    return keccak256(this.value[0] + this.value[1].getHash().slice(2));
  }

  calculateLeafHash() {
    return keccak256(this.value[0] + this.value[1]);
  }
}

// MPT 类
class MPT {
  constructor() {
    this.root = new MPTNode(NodeType.LeafNode, ['', '']);
    this.index = {};
  }

  addOrUpdateAddress(address, balance) {
    let nibbles = this.getNibbles(address);
    let node = this.root;
    for (let i = 0; i < nibbles.length; i++) {
      let nibble = nibbles[i];
      let child = node.value[nibble];
      if (!child) {
        child = new MPTNode(NodeType.LeafNode, ['', '']);
        node.value[nibble] = child;
      }
      node = child;
    }
    node.value[1] = balance.toString();
    this.index[address] = node;
    this.root = this.updateRoot(this.root, nibbles, balance.toString());
  }

  updateRoot(node, nibbles, balance) {
    let newRoot = node;
    if (node.type === NodeType.LeafNode) {
      if (node.value[1] === balance) {
        return node;
      }
      newRoot = new MPTNode(NodeType.LeafNode, ['', '']);
      newRoot.value[nibbles[0]] = node;
    }
    if (nibbles.length === 0) {
      return newRoot;
    }
    let nibble = nibbles[0];
    let child = node.value[nibble];
    if (!child) {
      child = new MPTNode(NodeType.LeafNode, ['', '']);
      newRoot = new MPTNode(NodeType.BranchNode, new Array(16).fill(null));
      newRoot.value[nibble] = child;
    }
    let updatedChild = this.updateRoot(child, nibbles.slice(1), balance);
    newRoot.value[nibble] = updatedChild;
    if (updatedChild.type === NodeType.LeafNode && updatedChild.value[1] === '') {
      newRoot.value[nibble] = null;
    }
    if (newRoot.value.every(child => child === null)) {
      newRoot = new MPTNode(NodeType.LeafNode, ['', '']);
    } else if (newRoot.type === NodeType.BranchNode) {
      newRoot = this.compactBranchNode(newRoot);
    }
    return newRoot;
  }

  compactBranchNode(node) {
    let nonNullChildren = node.value.filter(child => child !== null);
    if (nonNullChildren.length === 1) {
      let child = nonNullChildren[0];
      if (child.type === NodeType.ExtensionNode) {
        return new MPTNode(NodeType.ExtensionNode, [node.value.indexOf(child), child.value[1]]);
      } else if (child.type === NodeType.LeafNode) {
        return child;
      }
    }
    return node;
  }

  getNibbles(address) {
    let nibbles = [];
    for (let i = 0; i < address.length; i += 2) {
      let byte = parseInt(address.slice(i, i + 2), 16);
      nibbles.push(byte >> 4);
      nibbles.push(byte & 0xf);
    }
    return nibbles;
  }

  verify(address, balance) {
    let node = this.index[address];
    if (!node) {
      return false;
    }
    return node.value[1] === balance.toString();
  }
}

// 示例
const mpt = new MPT();
mpt.addOrUpdateAddress('0x1234', 100);
mpt.addOrUpdateAddress('0x5678', 200);
console.log(mpt.root.getHash()); // 输出树根哈希值
console.log(mpt.index); // 输出索引
console.log(mpt.verify('0x1234', 100)); // 输出 true
console.log(mpt.verify('0x5678', 100)); // 输出 false