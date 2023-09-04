import React, { useEffect, useState } from 'react';
import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs'
import Hammer from 'react-hammerjs';

// @ts-ignore
import nodeHtmlLabel from 'cytoscape-node-html-label';
import dagre from 'cytoscape-dagre';

import './style.css';
import { reprocess_data } from './process';
import { stylesheet } from './stylesheet';
import { Table } from '../table';
import { Drawer, Spin } from 'antd';
import { PipeTable } from '@src/types';

Cytoscape.use(nodeHtmlLabel);
Cytoscape.use(dagre);

function Cy() {
  const [drawerWidth, setWidth] = useState(600);
  const [visible, setVisible] = useState(false);
  const [graphData, setGraphData] = useState<Cytoscape.ElementDefinition[]>([]);
  const [currentTable, setCurrentTable] = useState<PipeTable>();
  const [loading, setLoading] = useState(false);
  const [cy, setCy] = useState<Cytoscape.Core>();

  useEffect(() => {
    async function loadGraph() {
      setLoading(true);
      const response = await fetch(process.env['REACT_APP_GET_GRAPH_URL'] as string);
      const data = await response.json();

      const {nodes, edges} = reprocess_data(data);
      const elements: Cytoscape.ElementDefinition[] =
        Array.from(nodes.entries())
          .map(([name, options]) => ({
            selectable: options.type !== 'group',
            data: {
              id: name,
              label: name,
              parent: options.parent,
              type: options.type,
              indexes: options.indexes,
              size: options.size,
              store_class: options.store_class
            }
          }));

      edges.forEach(edge => {
        elements.push({
          grabbable: false,
          data: edge
        })
      })

      setGraphData(elements);
      setLoading(false);
    }

    loadGraph()
  }, []);

  useEffect(() => {
    if (cy === undefined) return;
    if (cy.elements().length === 0) return;
    if (loading) return;
    cy.layout({
      name: 'dagre',
      nodeDimensionsIncludeLabels: true,
      spacingFactor: 1,
      nodeSep: 20,
      rankSep: 20,
    } as dagre.DagreLayoutOptions).run();

    cy.on('tap', event => {
      const node = event.target;
      if (node === cy) {
        setVisible(false);
        return;
      }
    });

    cy.on('select', 'node', selected => {
      const node = selected.target;
      if (node === cy) {
        setVisible(false);
        return;
      }

      if (node.data('type') === 'table') {
        setCurrentTable(node.data());
        setVisible(true);
      }

      node.connectedEdges().forEach((edge: any) => {
        if (edge.target().id() !== node.id()) {
          edge.select()
        }
      });
    });

    // @ts-ignore
    cy.nodeHtmlLabel([
      {
        query: 'node',
        halign: 'center',
        valign: 'center',
        halignBox: 'center',
        valignBox: 'center',
        tpl(data: Cytoscape.NodeDataDefinition) {
          return `
            <div class="node-core" style="width: ${
            Math.max(
              data.label.length * 10,
              (data.indexes || []).join(', ').length * 6
            )
          }; height: 70px">
                ${data.type === 'table' ? `<div class="icon icon-table"></div>` : ''}
                ${data.type === 'transform' ? `<div class="icon icon-fn"></div>` : ''}
                <div class="name">${/lambda/.test(data.label) ? 'lambda' : data.label}</div>
                ${data.indexes ? `<div class="indexes">${data.indexes.join(', ')}</div>` : ''}
                ${data.size ? `<div class="indexes">size: ${data.size}</div>` : ''}
                ${data.store_class ? `<div class="store">${data.store_class}</div>` : ''}
            </div>
          `
        }
      },
    ])
  }, [cy, loading])

  return (
    <>
      {loading && <Spin className="spin" spinning={true} />}
      <Drawer
        mask={false}
        autoFocus={false}
        width={drawerWidth} title={<>Table: <span style={{ color: 'blue' }}>{currentTable?.id}</span></>} onClose={() => setVisible(false)} visible={visible}>
        <Hammer
          direction={'DIRECTION_HORIZONTAL'}
          onPan={(pan) => {
            setWidth(Math.max(window.innerWidth - pan.center.x, 600))
          }}>
          <div className="dragger">
            <div className="drag-badge">=</div>
          </div>
        </Hammer>
        {currentTable && <Table current={currentTable} />}
      </Drawer>
      <CytoscapeComponent
        stylesheet={stylesheet}
        cy={setCy}
        autoungrabify
        elements={graphData}
        className="cy-container"/>
    </>
  )
}

export default Cy;
