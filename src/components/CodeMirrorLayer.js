import React, { useRef, useState } from 'react'
import { Controlled as CodeMirror } from 'react-codemirror2'
import 'codemirror/mode/sql/sql'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/darcula.css'
import 'codemirror/addon/display/fullscreen.css'
import 'codemirror/addon/display/fullscreen.js'
import 'codemirror/addon/selection/active-line'
import styled from 'styled-components'
import { FullscreenOutlined } from '@ant-design/icons'
import { Tooltip } from '@material-ui/core'

const CodeMirrorWrapper = styled.div`
  position: relative;
  .CodeMirror {
    border-radius: 6px;
  }
  .CodeMirror-fullscreen {
    z-index: 999;
  }
  .full-icon {
    visibility: hidden;
    position: ${(props) => (props.isFull ? 'fixed' : 'absolute')};
    cursor: pointer;
    z-index: 1000;
    top: 2px;
    right: 2px;
    padding: 2px 4px;
    background: rgba(255,255,255,.6);
    color: rgba(0, 0, 0, 0.6);
    border-radius: 4px;
    &:hover {
      background: rgba(255,255,255,.9);
      color: rgba(0, 0, 0, 0.9);
    }
  }
  &:hover {
    .full-icon {
      visibility: visible;
    }
  }
`

const CodeMirrorLayer = ({ _value, onChange, fullscreenButton, disabled, ...restProps }) => {
  const [value, setValue] = useState('')
  const cmRef = useRef(null)
  const [isFull, setIsFull] = useState(false)
  const handleChange = (editor, data, v) => {
    if(disabled) {
      return
    }
    setValue(v)
    onChange?.(v)
  }

  const toggleFullScreen = () => {
    const editor = cmRef.current?.editor
    if (editor) {
      const isFull = !editor.getOption('fullScreen')
      editor.setOption('fullScreen', isFull)
      setIsFull(isFull)
    }
  }

  return (
    <CodeMirrorWrapper isFull={isFull}>
      <CodeMirror
        ref={cmRef}
        value={_value || value}
        onBeforeChange={handleChange}
        onChange={handleChange}
        {...restProps}
      />
      {fullscreenButton && (
        <Tooltip title={'切换全屏'}>
          <FullscreenOutlined className={'full-icon'} onClick={toggleFullScreen} />
        </Tooltip>
      )}
    </CodeMirrorWrapper>
  )
}

export default CodeMirrorLayer
