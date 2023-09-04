import React from 'react';
import './App.css';
import "antd/dist/antd.min.css";
import { Cy } from './features';

function App() {
  // @ts-ignore
  window.fetch = (url: string) =>
    new Promise(resolve => {
      setTimeout(() => {
        if (/graph/.test(url)) {
          import('./example').then(({data}) => {
            // @ts-ignore
            return resolve({
              json: () => Promise.resolve(data)
            })
          });
        }
        ;
        if (/get-data/.test(url)) {
          const _query = new URLSearchParams(url);
          const page = _query.get('page') || 0;
          const pageSize = _query.get('pageSize') || 20;
          import('./example').then(({tableData}) => {
            // @ts-ignore
            return resolve({
              json: () => Promise.resolve({
                data: tableData,
                total: tableData.length,
                page,
                page_size: pageSize,
              })
            })
          });
        }
      }, 500)
    })

  return (
    <>
      <Cy/>
    </>
  );
}

export default App;
