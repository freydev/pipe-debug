import React, { useEffect, useState } from 'react';
import { Button, Table as AntTable } from 'antd'
import { ColumnsType } from 'antd/lib/table';
import ReactJson from 'react-json-view';
import { omit, parseInt } from 'lodash';
import { PipeTable } from '../../types';

interface Options {
  total: number;
  page: number;
  pageSize: number;
}

interface FocusType {
  table_name: string;
  key: string;
  indexes: {
    [name: string]: string | number;
  }
}

function Table({current}: { current: PipeTable }) {
  const [columns, setColumns] = useState<ColumnsType<any>>([]);
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState<FocusType>();
  const [options, setOptions] = useState<Options>({
    total: 0,
    page: 0,
    pageSize: 20,
  });

  useEffect(() => {
    async function loadTable() {
      const url = new URLSearchParams();
      url.append('table', current.id);
      setLoading(true);
      let response;
      if (focus) {
        response = await fetch(process.env['REACT_APP_GET_FOCUS_TABLE_URL'] as string, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            table_name: current.id,
            focus: {
              table_name: focus.table_name,
              items_idx: Object.entries(focus.indexes).map(([idx, v]) => {
                return { [idx]: v }
              })
            }
          })
        })
      } else {
        response = await fetch(process.env['REACT_APP_GET_TABLE_URL'] as string + `?${url}`);
      }
      const data = await response.json();
      setColumns(Object.keys(data.data[0]).map(column => ({
        title: column,
        dataIndex: column,
        sorter: typeof data.data[0][column] !== 'object' && (
          (a, b) => {
            const v1 = a[column];
            const v2 = b[column];
            if (!v1 || !v2) return 0;
            return parseInt(v1) ? parseInt(v1) - parseInt(v2) :
              v1.localeCompare(v2)
          }),
        render: value => {
          if (typeof value === 'object') {
            return <ReactJson
              name={false}
              collapsed
              enableClipboard={false}
              displayDataTypes={false}
              src={value}/>
          }
          return value;
        }
      })))

      setData(data.data.map((element: any, index: number) => ({...element, index})));
      setLoading(false);
      setOptions(omit(data, 'data') as any)
    }

    if (focus && focus.table_name === current.id) return;
    loadTable()
  }, [current, focus])

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => {
      const selected = selectedRows[0];
      setFocus({
        table_name: current.id,
        key: selectedRowKeys[0] as string,
        indexes: current.indexes.reduce((acc, index) => {
          acc[index] = selected[index];
          return acc;
        }, {} as FocusType['indexes'])
      })
    },
  };

  return <>
    <div style={{ height: focus ? 60 : 1, opacity: focus ? 1 : 0, transition: '.2s all ease-out', overflow: 'hidden' }}>
        <div style={{ color: 'red' }}>
          <strong>Focus mode</strong>
        </div>
        {focus && <>
        table: <strong>{focus?.table_name}&nbsp;</strong>
        indexes:&nbsp;
        {Object.entries(focus?.indexes || []).map(([idx, v], index) => {
          return <span key={index}>
            <strong>{idx}</strong>=<strong>{v}</strong>&nbsp;
          </span>;
        })}
        &nbsp;<Button size="small" onClick={() => setFocus(undefined)}>Clear</Button>
        </>}
    </div>
    <AntTable
      loading={loading}
      showHeader={!loading}
      rowKey={(record) => `${current.id}_${record.index}`}
      rowSelection={{
        type: 'radio',
        selectedRowKeys: focus ? [focus.key] : [],
        preserveSelectedRowKeys: true,
        ...rowSelection,
      }}
      size="small"
      pagination={{
        pageSize: 100,
      }}
      style={{width: '100%'}}
      columns={columns}
      dataSource={loading ? [] : data}/>
  </>
}

export { Table }
