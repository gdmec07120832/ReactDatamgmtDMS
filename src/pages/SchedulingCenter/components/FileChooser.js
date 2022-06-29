import React, { useCallback, useEffect, useState } from 'react'
import DraggableModal from '../../../components/DraggableModal'
import { useRequest } from 'ahooks'
import axios from '../../../utils/axios'
import { list_to_tree } from '../../../utils/helpers'
import { Button, Input, message, Tree } from 'antd'
import eachDeep from 'deepdash/eachDeep'
import debounce from 'lodash/debounce'
import filterDeep from 'deepdash/es/filterDeep'

function FileChooser(props) {
  const [key, setKey] = useState(1)
  const { fileType, setFileType, onSuccess } = props
  const [fileTree, setFileTree] = useState([])
  const [keyword, setKeyword] = useState()
  const [filteredData, setFilteredData] = useState([])

  const [selectedNode, setSelectedNode] = useState(null)

  const close = () => {
    setFileType(null)
  }

  const { run: getFileList } = useRequest(
    () => {
      if (!fileType) {
        return Promise.resolve()
      }
      return axios
        .get('/bi-task-scheduling-system/api/user/common/listFile', {
          params: {
            fileType,
          },
        })
        .then(({ data }) => {
          const _treeData = list_to_tree(data, 'pid', 0)
          const treeData = eachDeep(
            _treeData,
            (child) => {
              child.isLeaf = child.fileType === 'file'
              child.key = child.filePath + child.name
              child.title = child.name
            },
            { childrenPath: 'children' }
          )
          setFileTree(treeData)
          setFilteredData(treeData)
        })
    },
    { manual: true }
  )
// eslint-disable-next-line
  const search = useCallback(
      // eslint-disable-next-line
    debounce((word) => {
      const ret = filterDeep(
        fileTree,
        (child) => {
          return [child.name].some((_word) => {
            return (_word || '').toLowerCase().indexOf((word || '').toLowerCase()) > -1
          })
        },
        {
          childrenPath: ['children'],
          onTrue: { skipChildren: true },
        }
      )

      setFilteredData(ret)
      setKey((prevState) => prevState + 1)
    }, 200),
    [fileTree, setFilteredData]
  )

  useEffect(() => {
    search(keyword)
  }, [keyword, search])

  const handleRefresh = () => {
    getFileList()
    search(keyword)
    message.success('已刷新')
  }

  const onSelect = (v, { node }) => {
    // 可以做双击选中，暂时先不做
    setSelectedNode(node)
  }

  useEffect(() => {
    getFileList()
  }, [fileType, getFileList])

  const handleSubmit = () => {
    if (selectedNode?.fileType === 'file') {
      close()
      onSuccess?.(selectedNode)
    } else {
      message.error('请选择文件')
    }
  }

  return (
    <DraggableModal
      destroyOnClose
      width={600}
      title={'选择文件'}
      visible={!!fileType}
      onCancel={close}
      onOk={handleSubmit}>
      <div>
        <div className={'flex justify-between mb-3'}>
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} allowClear />
          <div>
            <Button onClick={handleRefresh}>刷新</Button>
          </div>
        </div>
        <Tree.DirectoryTree defaultExpandAll key={key} treeData={filteredData} height={400} onSelect={onSelect} />
      </div>
    </DraggableModal>
  )
}

export default FileChooser
