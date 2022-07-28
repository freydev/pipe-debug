interface PipeTable {
  name: string,
  indexes: string[],
  size: number,
  store_class: string
}

interface GraphData {
  catalog: {
    [name: string]: PipeTable
  }
  pipeline: Node[]
}

interface BaseNode {
  type: string;
  name?: string;
  func?: string;
}

interface TransformNode extends BaseNode {
  type: 'transform';
  inputs: string[];
  outputs: string[];
}

interface MetaNode extends BaseNode {
  type: 'meta';
  graph: GraphData;
}

type Node = MetaNode | TransformNode
export type { TransformNode, MetaNode, PipeTable, GraphData }