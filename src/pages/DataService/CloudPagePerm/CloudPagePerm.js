import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Button, Input, message, Popconfirm, Table} from 'antd';
import {CaretDownOutlined, CaretRightOutlined, PlusOutlined} from '@ant-design/icons';
import {useSelector} from 'react-redux';
import {useRequest} from 'ahooks';
import axios from '../../../utils/axios';
import styled from 'styled-components';
import EditModal from './EditModal';
import debounce from 'lodash/debounce';
import filterDeep from 'deepdash/es/filterDeep';
import mapDeep from 'deepdash/es/mapDeep';
import CollapseButtons from '../../../components/CollapseButtons';


const ExpandWrap = styled.div.attrs({
  className: 'ant-table-row-expand-icon text-gray-400',
})`
  &:before,
  &:after {
    display: none;
  }
  border: none;
  background: transparent;
`

function CloudPagePerm() {
  const permissionsMap = useSelector((state) => state.user.permissionsMap)
  const [keyword, setKeyword] = useState('')
  const [dataSource, setDataSource] = useState([])

  const [columns] = useState([
    { dataIndex: 'name', title: '页面名称' },
    {
      dataIndex: 'action',
      title: '操作',
      width: 200,
      render(text, row) {
        return (
            <CollapseButtons>
              {!row.parentId && permissionsMap['bi-mobile-aliyun.PagePermissionController.saveOrUpdate'] && (
                  <Button
                      type={'link'}
                      size={'small'}
                      onClick={(e) => {
                        e.stopPropagation()
                        addChild(row)
                      }}>
                    添加
                  </Button>
              )}
              {permissionsMap['bi-mobile-aliyun.PagePermissionController.saveOrUpdate'] && (
                  <Button
                      type={'link'}
                      size={'small'}
                      onClick={(e) => {
                        e.stopPropagation()
                        editRow(row)
                      }}>
                    编辑
                  </Button>
              )}
              {!row?.children?.length && permissionsMap['bi-mobile-aliyun.PagePermissionController.delete'] && (
                  <Popconfirm
                      title={'确定删除吗？'}
                      onCancel={(e) => e.stopPropagation()}
                      onConfirm={(e) => {
                        e.stopPropagation()
                        delRow(row)
                      }}>
                    <Button type={'link'} size={'small'} danger onClick={(e) => e.stopPropagation()}>
                      删除
                    </Button>
                  </Popconfirm>
              )}
            </CollapseButtons>
        )
      },
    },
  ])
  const [expandedRowKeys, setExpandedRowKeys] = useState([])

  const [currentRow, setCurrentRow] = useState(null)

  const addRoot = () => {
    setCurrentRow({})
  }

  const addChild = (row) => {
    setCurrentRow(row)
  }

  const editRow = (row) => {
    setCurrentRow({
      ...row,
      __isEdit__: true,
    })
  }

  const delRow = (row) => {
    axios
        .get('/bi-mobile-aliyun/api/admin/pagePermission/delete', {
          params: { id: row.id },
        })
        .then(() => {
          message.success('删除成功')
          getList()
        })
  }


  const dataRef = useRef([])
  const { run: getList, loading } = useRequest(
      () => {
        return axios.get('/bi-mobile-aliyun/api/admin/pagePermission/list', {
          params: {
            appCode: 'DigitalSupplier'
          }
        }).then(({ data }) => {
          dataRef.current = data
          debounceSearch(keyword)
        })
      },
      { manual: true }
  )

  useEffect(() => {
    getList()
  }, [getList])

  const debounceSearch = useMemo(() => {
    return debounce((val) => {
      let ret
      if (val) {
        ret = filterDeep(
            dataRef.current,
            (value) => {
              if (value.name.toLowerCase().includes(val?.toLowerCase())) {
                return true
              }
            },
            { childrenPath: 'children', onTrue: { skipChildren: true } }
        )
        const keys = mapDeep(ret || [], (value) => {
          return String(value?.id)
        } , {childrenPath: 'children'})
        setExpandedRowKeys(keys.filter(Boolean))
      } else {
        ret = dataRef.current
        // setExpandedRowKeys([])
      }
      setDataSource(ret)
    }, 200)
  }, [])

  const handleKeywordChange = useCallback(
      (e) => {
        setKeyword(e.target.value)
        debounceSearch(e.target.value)
      },
      [debounceSearch]
  )

  return (
      <div className={'p-6 bg-white'}>
        <div className={'flex justify-between mb-2.5'}>
          <Input value={keyword} className={'w-60'} placeholder={'输入页面名称搜索'} allowClear onChange={handleKeywordChange} />
          <div>
            {permissionsMap['bi-mobile-aliyun.PagePermissionController.saveOrUpdate'] && (
                <Button type={'primary'} icon={<PlusOutlined />} onClick={addRoot}>
                  添加主页面
                </Button>
            )}
          </div>
        </div>

        <Table
            columns={columns}
            loading={loading}
            expandable={{
              expandedRowKeys: expandedRowKeys,
              onExpandedRowsChange: (expandedRows) => {
                setExpandedRowKeys(expandedRows)
              },
              expandRowByClick: true,
              expandIcon: ({ record, expanded }) => {
                if (!record?.children?.length) {
                  return <ExpandWrap />
                } else {
                  return <ExpandWrap>{expanded ? <CaretDownOutlined /> : <CaretRightOutlined />}</ExpandWrap>
                }
              },
            }}
            scroll={{ y: 'calc(100vh - 270px)' }}
            rowKey={(row) => String(row.id)}
            size={'small'}
            pagination={false}
            dataSource={dataSource}
        />

        <EditModal currentRow={currentRow} setCurrentRow={setCurrentRow} onSuccess={getList} />
      </div>
  );
}

export default CloudPagePerm;