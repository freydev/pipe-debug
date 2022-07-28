import React, { useCallback, useEffect, useState } from 'react';
import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs'
import "cytoscape-context-menus/cytoscape-context-menus.css";
import Hammer from 'react-hammerjs';

// @ts-ignore
import nodeHtmlLabel from 'cytoscape-node-html-label';
import dagre from 'cytoscape-dagre';
import contextMenus from 'cytoscape-context-menus';

import './style.css';
import { reprocess_data } from './process';
import { Drawer, Spin } from 'antd';
import { stylesheet } from './stylesheet';
import { Table } from '../table';

Cytoscape.use(nodeHtmlLabel);
Cytoscape.use(dagre);
Cytoscape.use(contextMenus);

function Cy() {
  const [drawerWidth, setWidth] = useState(400);
  const [visible, setVisible] = useState(false);
  const [graphData, setGraphData] = useState<Cytoscape.ElementDefinition[]>([]);
  const [currentTable, setCurrentTable] = useState('');
  const [loading, setLoading] = useState(false);

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

  const cyHandler = useCallback((cy: Cytoscape.Core) => {
    cy.layout({
      name: 'dagre',
      nodeDimensionsIncludeLabels: true,
      spacingFactor: 1,
      nodeSep: 20,
      rankSep: 20,
    } as dagre.DagreLayoutOptions).run();

    // @ts-ignore
    cy.contextMenus({
      evtType: "cxttap",
      menuItems: [
        {
          id: "details",
          content: "View Details...",
          tooltipText: "View Details",
          selector: 'node[type = "table"]',
          onClickFunction: function (event: Cytoscape.EventObject) {
            setCurrentTable(event.target.data('id'));
            setVisible(true);
          },
          hasTrailingDivider: true
        },
      ],
      menuItemClasses: ["custom-menu-item", "custom-menu-item:hover"],
      contextMenuClasses: ["custom-context-menu"]
    });

    cy.on('select', 'node', node => {
      node.target.connectedEdges().forEach((edge: any) => {
        if (edge.target().id() !== node.target.id()) {
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
                <div class="name">${data.label}</div>
                ${data.indexes ? `<div class="indexes">${data.indexes.join(', ')}</div>` : ''}
                ${data.size ? `<div class="indexes">size: ${data.size}</div>` : ''}
                ${data.store_class ? `<div class="store">${data.store_class}</div>` : ''}
            </div>
          `
        }
      },
    ])
  }, [])

  return (
    <>
      {loading && <Spin className="spin" spinning={true} />}
      <Drawer width={drawerWidth} title={currentTable} onClose={() => setVisible(false)} visible={visible}>
        <Hammer
          direction={'DIRECTION_HORIZONTAL'}
          onPan={(pan) => {
            setWidth(window.innerWidth - pan.center.x)
          }}>
          <div className="dragger">
            <div className="drag-badge">=</div>
          </div>
        </Hammer>
        <Table name={currentTable} />
      </Drawer>
      <CytoscapeComponent
        stylesheet={stylesheet}
        cy={cyHandler}
        autoungrabify
        elements={graphData}
        className="cy-container"/>
    </>
  )
}

export default Cy;