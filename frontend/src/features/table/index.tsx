import React, { useEffect, useState } from 'react';
import { Table as AntTable } from 'antd'
import { ColumnsType } from 'antd/lib/table';
import ReactJson from 'react-json-view';
import { omit, parseInt } from 'lodash';

interface Options {
  total: number;
  page: number;
  pageSize: number;
}

function Table({ name }: { name: string }) {
  const [columns, setColumns] = useState<ColumnsType<any>>([]);
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Options>({
    total: 0,
    page: 0,
    pageSize: 20,
  });

  useEffect(() => {
    async function loadTable() {
      const url = new URLSearchParams();
      url.append('table', name);
      setLoading(true);
      const response = await fetch(process.env['REACT_APP_GET_TABLE_URL'] as string + `?${url}`);
      const data = await response.json();
      setColumns(Object.keys(data.data[0]).map(column => ({
        title: column,
        dataIndex: column,
        sorter: typeof data.data[0][column] !== 'object' && (
          (a, b) => {
          const v1 = a[column];
          const v2 = b[column];
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
              src={value} />
          }
          return value;
        }
      })))

      setData(data.data);
      setLoading(false);
      setOptions(omit(data, 'data') as any)
    }

    loadTable()
  }, [name])

  return <AntTable
    loading={loading}
    size="small"
    pagination={{
      pageSize: 100,
    }}
    style={{ width: '100%' }}
    columns={columns}
    dataSource={data}/>
}

export { Table }
