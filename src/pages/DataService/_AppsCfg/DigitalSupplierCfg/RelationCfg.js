import React, {useCallback, useEffect, useState} from 'react';
import {Button, Form, Input, Transfer} from 'antd';
import ExTable from '../../../../components/ExTable/ExTable';
import {useRequest} from 'ahooks-v3';
import axios from '../../../../utils/axios';
import DraggableModal from '../../../../components/DraggableModal';
import {useForm} from 'antd/es/form/Form';
import OverflowTooltip from '../../../../components/OverflowTooltip';
import {useSelector} from 'react-redux';



const EditModal = (props) => {
  const {currentRow, setCurrentRow, onSuccess} = props
  const permissionsMap = useSelector(state => state.user.permissionsMap)
  const handleCancel = () => {
    setCurrentRow(null)
  }

  const {runAsync: getUserInfo} = useRequest((params) => {
    return axios.get('/bi-mobile-aliyun/api/user/supplier/selectContactInfoByUserId', {
      params
    })
  }, {manual: true})

  const [form] = useForm()

  const [companyList, setCompanyList] = useState([])
  useEffect(() => {
    axios.get('/bi-mobile-aliyun/api/user/supplier/selectAllCompany').then(({data}) => {
      setCompanyList((data || []).map(item => {
        return {
          key: item.companyCode,
          label: `${item.companyShortName}(${item.companyName})`,
          value: item.companyCode,
          disabled: false
        }
      }))
    })
  }, [])

  const [autoSyncCode, setAutoSyncCode] = useState([])
  useEffect(() => {
    if (currentRow) {
      getUserInfo({
        userId: currentRow.userId
      }).then(({data}) => {
        setAutoSyncCode(data.companys.filter(item => item.autoSync).map(item => item.companyCode))
        form.setFieldsValue({
          userId: currentRow.userId,
          companyContactName: data.companyContactName,
          companyCodeList: data.companys.map(item => item.companyCode)
        })
      })
    } else {
      form.resetFields()
    }
  }, [
    currentRow, getUserInfo, form
  ])


  const {runAsync: submitForm, loading: submitLoading} = useRequest((params) => {
    return axios.post('/bi-mobile-aliyun/api/admin/supplier/updateCompanyContactRelationship', params)
  }, {manual: true})

  const handleOk = () => {
    const values = form.getFieldsValue(true)

    submitForm({
      userId: values.userId,
      companyCodeList: values.companyCodeList.join(',')
    }).then(() => {
      onSuccess?.()
      handleCancel()
    })
  }

  return <DraggableModal width={800} visible={!!currentRow} title={'??????'} onCancel={handleCancel}
                         onOk={handleOk} okButtonProps={{loading: submitLoading,
    disabled: !permissionsMap['bi-mobile-aliyun.SupplierController.updateCompanyContactRelationship']}}>
    <Form form={form}>
      <Form.Item hidden label={'userId'} name={'userId'}>
        <Input></Input>
      </Form.Item>
      <Form.Item label={'??????'} name={'companyContactName'}>
        <Input disabled></Input>
      </Form.Item>
      <Form.Item label={'??????'} name={'companyCodeList'} valuePropName={'targetKeys'}>
        <Transfer disabled={!permissionsMap['bi-mobile-aliyun.SupplierController.updateCompanyContactRelationship']}
                  dataSource={companyList.map(item => ({...item, disabled: autoSyncCode.includes(item.value)}))}
                  showSearch
                  listStyle={{flex: 1, height: 300}}
                  pagination={{pageSize: 20}}
                  render={(item) => item.label}
                  titles={['??????', '??????']}>

        </Transfer>
      </Form.Item>
    </Form>
  </DraggableModal>
}


function RelationCfg() {
  const permissionsMap = useSelector(state => state.user.permissionsMap)
  const [table, setTable] = useState({
    rowKey: 'userId',
    pagination: {
      total: 0,
      pageSize: 10,
      current: 1
    },
    dataSource: [],
    columns: [
      {
        dataIndex: 'companyContactName', title: '??????'
      },
      {
        dataIndex: 'dingSyncNo', title: '?????????', render(text) {
          return text || '--'
        }
      },
      {
        dataIndex: 'companys', title: '????????????', render(text) {
          return <OverflowTooltip>{text || '--'}</OverflowTooltip>
        }
      },
      {
        dataIndex: 'action', title: '??????', width: 120, render(text, row) {
          return <div className={'space-x-2.5'}>
            <Button type={'link'} size={'small'} onClick={() => editRow(row)}>{
              permissionsMap['bi-mobile-aliyun.SupplierController.updateCompanyContactRelationship'] ? '??????': '??????'
            }</Button>
          </div>
        }
      }
    ]
  })
  const [keyword, setKeyword] = useState('')

  const {runAsync: getData, loading} = useRequest((params) => {
    return axios.get('/bi-mobile-aliyun/api/admin/supplier/list', {
      params
    }).then(({data: {list, totalRows}}) => {
      setTable(prevState => ({
        ...prevState,
        dataSource: list,
        pagination: {...prevState.pagination, total: totalRows}
      }))
    })
  }, {
    debounceWait: 400,
    manual: true
  })

  const {current: page, pageSize} = table.pagination


  const _getData = useCallback(() => {
    getData({
      page,
      pageSize,
      keyword
    })
  }, [pageSize, page, getData, keyword])


  useEffect(() => {
   _getData()
  }, [_getData])


  const [currentRow, setCurrentRow] = useState(null)
  const editRow = (row) => {
    setCurrentRow(row)
  }

  return (
      <div className={'p-6'}>
        <div className={'grid grid-cols-4 gap-x-2'}>
          <div className={'flex'}>
            <span className={'mr-2'}>?????????</span>
            <Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder={'????????????????????????????????????'}
                   className={'flex-1'} allowClear/>
          </div>
        </div>

        <ExTable className={'mt-2.5'} {...table} loading={loading} setTable={setTable}/>

        <EditModal currentRow={currentRow} setCurrentRow={setCurrentRow} onSuccess={_getData}/>
      </div>
  );
}

export default RelationCfg;