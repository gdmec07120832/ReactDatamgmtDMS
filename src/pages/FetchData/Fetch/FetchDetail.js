import React, {useEffect, useRef, useState} from 'react'
import ArrowBack from '@material-ui/icons/ArrowBack'
import { DownloadOutlined } from '@ant-design/icons'
import { useHistory, useRouteMatch } from 'react-router-dom'
import DynamicQuery from '../components/DynamicQuery/DynamicQuery'
import styled from 'styled-components'
import { BaseTable, features, useTablePipeline } from 'ali-react-table'
import { useRequest } from 'ahooks-v3'
import axios from '../../../utils/axios'
import {Button, message} from 'antd'
import {useDispatch} from 'react-redux';

const MyBaseTable = styled(BaseTable)`
  --line-height: 1.5715;
  --font-size: 14px;
  --row-height: 32px;
  --header-row-height: 36px;
  --cell-padding: 16px;
  --lock-shadow: rgba(0, 0, 0, 0.2) 0 0 10px 0px;
  --border-color: #f0f0f0;
  --color: rgba(0, 0, 0, 0.85);
  --bgcolor: white;
  --hover-bgcolor: #fafafa;
  --highlight-bgcolor: #fafafa;
  --header-color: rgba(0, 0, 0, 0.85);
  --header-bgcolor: #fafafa;
  --header-hover-bgcolor: #f5f5f5;
  --header-highlight-bgcolor: #f5f5f5;

  &.compact {
    --cell-padding: 8px 8px;
  }

  td {
    transition: background 0.3s;
    white-space: nowrap;
    overflow: hidden;
  }

  th {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
  }

  &:not(.bordered) {
    --cell-border-vertical: none;
    --header-cell-border-vertical: none;

    thead > tr.first th {
      border-top: none;
    }
  }

  & {
    --row-height: 36px;
  }
  .art-table-cell {
    word-break: break-all;
  }

  & .resize-handle {
    width: 4px;
    right: -2px;
  }

  &,
  .art-horizontal-scroll-container {
    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    ::-webkit-scrollbar-thumb {
      background: #ccc;
      border: 1px solid #eaeaea;

      &:hover {
        background: #6e6e6e;
      }
    }

    ::-webkit-scrollbar-track {
      background: #eaeaea;
    }
  }
`

function FetchDetail() {
  const history = useHistory()
  const match = useRouteMatch()
  const { id } = match.params
  const handleBack = () => {
    history.go(-1)
  }
  const firstSearch = useRef(false)

  const [controller] =  useState(new AbortController())


  const [templateData, setTemplateData] = useState({})
  const [queryOptions, setQueryOptions] = useState([])

  const { run: getDetail } = useRequest(
    () => {
      return axios
        .get('/bi-data-fetch/api/user/biDfSqlTemplate/findById', {
          params: { id },
        })
        .then(({ data }) => {
          const { template, tempDetails } = data
          setTemplateData(template)
          setQueryOptions(tempDetails)
        })
    },
    { manual: true }
  )

  useEffect(() => {
    getDetail()
  }, [getDetail])
  
  const [allData, setAllData] = useState([])
  const [result, setResult] = useState([])
  const {
    run: getResult,
    loading: previewLoading,
    cancel: cancelPreview,
  } = useRequest(
    (sql, dataSourceId, params) => {
      return axios
        .post('/bi-data-fetch/api/user/biDfSqlTemplate/dataQuery', {
          // sql: sql,
          id: Number(id),
          dataSourceId: dataSourceId,
          parameters: params,
        }, {
          signal: controller.signal,
          timeout: 10 * 60 * 1000
        })
    },
    {
      manual: true,
      onSuccess: ({data}) => {
        setAllData(data)
        setResult(data)
      }
    }
  )

  useEffect(() => {
    return () => {
      cancelPreview()
      controller.abort()
    }
  }, [cancelPreview, controller])

  const pipeline = useTablePipeline()
    .input({
      dataSource: result,
      columns: Object.keys(result[0] || {}).map((key) => {
        return {
          name: key,
          code: key,
        }
      }),
    })
    .use(
      features.columnResize({
        fallbackSize: 120,
        handleHoverBackground: '#aaa',
        handleActiveBackground: '#89bff7',
      })
    )


  const [queryForm, setQueryForm] = useState({})
  const [queryParams, setQueryParams] = useState([])

  const handleQuery = () => {
    let hasFilledRequired = true
    for (let field of queryOptions) {
      let val = queryForm[field.colName + field.id]
      if(field.options === 'REQUIRED' &&  (!val || (Array.isArray(val) && !val.filter(Boolean).length)  )) {
        hasFilledRequired = false
        break
      }
    }
    if(!hasFilledRequired){
      message.error('请填写带*的必填项')
      return
    }
    console.log(queryForm)
    const q = Object.keys(queryForm).filter((key) => {
     return !(Array.isArray(queryForm[key]) && !queryForm[key].filter(Boolean).length)
    }).map(key => {
      const col = queryOptions.find(item => (item.colName + item.id) === key)
      return {
        column: key.replace(new RegExp(col.id + '$'), ''),
        alias: col?.alias || col?.colName,
        value: col?.colType === 'DATE' || col?.colType === 'DATETIME' ? queryForm[key][0]
            : Array.isArray(queryForm[key]) ? queryForm[key].toString() : queryForm[key],
        colType: col?.colType,
        value2: col?.colType === 'DATE' || col?.colType === 'DATETIME' ? queryForm[key][1] : undefined,
      }
    })
    setQueryParams(q)
    firstSearch.current = true
    if(templateData.sqlStr) {
      getResult(templateData.sqlStr, templateData.dataSourceId, q)
    }
  }

  const dispatch = useDispatch()
  const handleDownload = () => {
    axios.post('/bi-data-fetch/api/admin/biDfDataFile/saveOrUpdate', {
      params: queryParams,
      templateId: templateData.id
    }).then(() => {
      axios.get('/bi-data-fetch/api/user/notification/getDownloadTaskCount').then(({data}) => {
        dispatch({
          type: 'set_menuBadges',
          payload: {
            'fetchData-download': data
          }
        })
      })
      message.success(<div className={'inline-block'}>
        <span style={{color: 'var(--primary-color)'}} className={'pr-1'}>{templateData.templateName}</span>
        下载任务已经生成，请前往下载任务查看下载进度
      </div>)
    })
  }

  return (
    <div style={{ background: 'var(--content-section-bg-color)' }}>
      <div className={'bg-white flex p-2 space-x-2.5'}>
        <ArrowBack className={'text-gray-500 cursor-pointer'} onClick={handleBack} />
        <span>{templateData.templateName}</span>
      </div>
      <div className={'bg-white px-6 py-4'}>
        <DynamicQuery
          form={queryForm}
          setForm={setQueryForm}
          onReset={() => {
            setQueryForm({})
          }}
          onQuery={handleQuery}
          fields={queryOptions.map((item) => {
            return {
              ...item,
              label: item.alias || item.colName,
              prop: item.colName,
            }
          })}
        />
      </div>

      <div className={'mt-4 px-6 py-4 bg-white'}>
        <div className={'flex pt-1 pb-4 justify-between'}>
          <div>预览TOP100</div>
          {
            <div className={'text-blue-500 cursor-pointer'}>
              <Button size={'small'} type={'link'} disabled={!allData.length || previewLoading}  onClick={handleDownload}><DownloadOutlined />下载数据</Button>
            </div>
          }
        </div>

        <MyBaseTable
          isLoading={previewLoading}
          useVirtual={false}
          style={{ maxHeight: 440, overflow: 'auto', borderTop: allData?.length ? '' : 'var(--cell-border-horizontal)' }}
          className={'bordered compact'}
          {...pipeline.getProps()}
          components={{
            EmptyContent: () => firstSearch.current ? <div>此条件下暂无数据，请尝试更改查询条件</div> : <div>
              点击上方【查询】按钮，即可【预览】、【下载数据】
            </div>,
          }}
        />
      </div>
    </div>
  )
}

export default FetchDetail
