import React, { useEffect, useRef } from 'react'
import DraggableModal from '../../../components/DraggableModal'
import { Button, Spin } from 'antd'
import axios from '../../../utils/axios'
import jsMind from './helper/jsMindWrapper'

import 'jsmind/style/jsmind.css'
import styled from 'styled-components'
import { Tooltip } from '@material-ui/core'
import { FullscreenOutlined } from '@ant-design/icons'
import { useRequest } from 'ahooks'
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'

const mindOptions = {
  container: 'jsmind_container', // [必选] 容器的ID，或者为容器的对象
  editable: false, // [可选] 是否启用编辑
  theme: 'primary', // [可选] 主题
  view: {
    hmargin: 10, // 思维导图距容器外框的最小水平距离
    vmargin: 10, // 思维导图距容器外框的最小垂直距离
    line_width: 1, // 思维导图线条的粗细
    line_color: '#555', // 思维导图线条的颜色
  },
  layout: {
    hspace: 100, // 节点之间的水平间距
    vspace: 20, // 节点之间的垂直间距
    pspace: 13, // 节点与连接线之间的水平间距（用于容纳节点收缩/展开控制器）
  },
  shortcut: {
    enable: false,
  },
}

const ToggleFullIcon = styled(FullscreenOutlined)`
  position: absolute;
  padding: 6px;
  border-radius: 4px;
  top: 0;
  right: 0;
  cursor: pointer;
  z-index: 999;
  background: #eee;
  &:hover {
    background: #ccc;
  }
`

const Wrapper = styled.div`
  .jsmind-inner {
    user-select: auto;
  }
  jmnode {
    padding: 6px 10px;
    font-size: 14px;
    &.root {
      font-size: 17px;
    }
  }
  jmexpander {
    line-height: 7px;
  }
`

function DepTreeModal(props) {
  const { data, setData, type } = props
  const domRef = useRef()
  const jsMindRef = useRef()
  const jmInsRef = useRef(null)
  const close = () => {
    setData(null)
    jmInsRef.current = null
  }

  const { run: getData, loading } = useRequest(
    (id) => {
      return axios.get(`/bi-task-scheduling-system/api/user/${type}/selectDepInfoForDepTreeById`, {
        params: { id },
      })
    },
    { manual: true }
  )

  useEffect(() => {
    if (data?.id) {
      getData(data.id).then(({ data: treeData }) => {
        jmInsRef.current = new jsMind(mindOptions)
        jmInsRef.current.show({
          meta: {
            name: 'job depend relationship',
            version: '0.1',
          },
          format: 'node_tree',
          data: treeData,
        })
        setTimeout(() => {
          const nodes = jsMindRef.current?.querySelectorAll('jmnode')
          if (nodes) {
            tippy(nodes, {
              content(reference) {
                return reference.innerText
              },
              appendTo: jsMindRef.current,
              interactive: true,
            })
          }
        })
        setTimeout(() => {
          jmInsRef.current.resize()
        }, 10)
      })
    }
  }, [data, type, getData])

  const toggleFull = () => {
    if (!document.fullscreenElement) {
      domRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    const handler = () => {
      setTimeout(() => {
        jmInsRef.current?.resize()
      }, 50)
    }
    document.addEventListener('fullscreenchange', handler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
    }
  }, [])

  return (
    <DraggableModal
      destroyOnClose
      width={960}
      footer={[
        <Button onClick={close} key={'close'}>
          关闭
        </Button>,
      ]}
      title={'依赖关系'}
      visible={!!data}
      onCancel={close}>
      <Spin spinning={loading}>
        <Wrapper ref={domRef} className={'h-96 relative bg-white'}>
          <Tooltip title={'切换全屏'}>
            <ToggleFullIcon onClick={toggleFull} />
          </Tooltip>

          <div ref={jsMindRef} id={'jsmind_container'} className={'h-full w-full'} />
        </Wrapper>
      </Spin>
    </DraggableModal>
  )
}

export default DepTreeModal
