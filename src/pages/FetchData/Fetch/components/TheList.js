import React, {useEffect, useState} from 'react';
import {Empty, message, Modal, Pagination, Spin} from 'antd';
import classNames from 'classnames';
import styled from 'styled-components';
import axios from '../../../../utils/axios';
import {useRequest} from 'ahooks-v3';
import {useHistory} from 'react-router-dom';

const Item = styled.div`
  transition: all .3s;

  &:hover {
    box-shadow: rgba(181, 181, 181, 0.26) 0 4px 5px 0;
    transform: translateY(-3px);
  }
`


function TheList(props) {
  const {keyword, dataFieldId, viewType} = props
  const [dataSource, setDataSource] = useState([])
  const [pagination, setPagination] = useState({
    pageSize: 5,
    current: 1,
    total: 0,
    hideOnSinglePage: true,
  })
  const {current, pageSize} = pagination
  const {run: getList, loading} = useRequest(
      () => {
        return axios
            .get(viewType === 'all' ? '/bi-data-fetch/api/user/biDfSqlTemplate/accessList' : '/bi-data-fetch/api/user/biDfSqlTemplate/havePermissionList', {
              params: {
                keyword,
                dataFieldId: dataFieldId,
                page: current,
                pageSize: pageSize,
              },
            })
            .then(({data: {list, totalRows}}) => {
              setDataSource(
                  list.map((item) => {
                    return {...item, hasAuth: true}
                  })
              )
              setPagination((prevState) => ({...prevState, total: totalRows}))
            })
      },
      {manual: true, debounceWait: 200}
  )
  useEffect(() => {
    if (dataFieldId && dataFieldId !== '-1') {
      setPagination((prevState) => ({...prevState, current: 1}))
      getList()
    }
  }, [dataFieldId, getList])

  useEffect(() => {
    if(dataFieldId && dataFieldId !== '-1') {
      getList()
    }
  }, [current, pageSize, getList, dataFieldId])

  useEffect(() => {
    if(dataFieldId && dataFieldId !== '-1') {
      setPagination(prevState => ({...prevState, current: 1}))
      getList()
    }
    // eslint-disable-next-line
  }, [keyword, getList])

  const authApply = (item) => {
    Modal.confirm({
      title: '????????????',
      okText: '??????',
      content: `??????????????????${item.templateName}?????????????????????`,
      onOk: () => {
        console.log(item)
        return axios.post('/bi-data-fetch/api/admin/biDfSqlTempAudit/permissionApply', null, {
          params: {
            templateId: item.id,
          },
        }).then(() => {
          message.success({
            content: (
                <span>
              <span className={'text-blue-500'}>{item.templateName}</span>{' '}
                  ????????????????????????????????????????????????????????????????????? ~
            </span>
            ),
          })
          getList()
        })
      },
    })
  }
  const history = useHistory()
  const jumpToFetch = (item) => {
    if (!item.hasAuth) {
      return
    }
    history.push(`/fetchData/fetchBy/${item.id}`)
  }
  const handlePageChange = (page, pageSize) => {
    setPagination((prevState) => ({
      ...prevState,
      current: page,
      pageSize,
    }))
  }
  return (
      <Spin spinning={loading}>
        {!dataSource.length && (
            <div className={'py-8'}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}/>
            </div>
        )}
        {dataSource.map((item) => (
            <Item key={item.id} className={'flex space-x-10 border border-gray-300 rounded-lg border-solid p-3 mb-4'}>
              <div className={'flex-1'}>
                <div className={'text-base font-semibold'}>{item.templateName}</div>
                <div className={'my-2 text-gray-500 line-clamp-2'}>{item.descr}</div>
                <div className={'flex flex-1 text-gray-500 space-x-8'}>
                  <div>
                    <span>???????????????</span>
                    <span>
                    {item.productManagerName}({item.productManagerId})
                  </span>
                  </div>
                  <div>
                    <span>??????????????????</span>
                    <span>
                    {item.businessManagerName}({item.businessManagerId})
                  </span>
                  </div>
                </div>
              </div>
              <div className={'flex text-sm space-x-4 self-end'}>
                {item.permissionStatus === 'PendingAudit' &&
                    <span className={'text-green-400 select-none'}>???????????????...</span>}
                {!item.permissions && item.permissionStatus !== 'PendingAudit' && (
                    <div onClick={() => authApply(item)} className={'cursor-pointer text-blue-500'}>
                      ????????????
                    </div>
                )}
                <div
                    onClick={() => item.permissions && jumpToFetch(item)}
                    className={classNames(
                        !item.permissions && 'cursor-not-allowed text-gray-300',
                        item.permissions && 'cursor-pointer text-blue-500'
                    )}>
                  ????????????
                </div>
              </div>
            </Item>
        ))}
        <Pagination className={'text-right py-4'} {...pagination} onChange={handlePageChange}/>
      </Spin>
  );
}

export default TheList;