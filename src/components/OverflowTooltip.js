import React, { useRef, useState, useEffect } from 'react'
import Tooltip from '@material-ui/core/Tooltip'
import { makeStyles } from '@material-ui/core/styles'
import styled from 'styled-components'

const useStyles = makeStyles(() => ({
  w640: {
    maxWidth: 640,
    fontSize: 12,
    lineHeight: '16px',
  },
}))

const Text = styled.div`
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
`

function OverflowTooltip(props) {
  const classes = useStyles()
  /**
   * 文本的Dom
   * @type {React.MutableRefObject<Element | undefined>}
   */
  const textElementRef = useRef()
  const compareSize = () => {
    const compare =
      textElementRef.current.scrollWidth > textElementRef.current.clientWidth ||
      textElementRef.current?.scrollHeight > textElementRef.current?.clientHeight
    setHover(compare)
  }

  useEffect(() => {
    compareSize()
    window.addEventListener('resize', compareSize)
    return () => {
      window.removeEventListener('resize', compareSize)
    }
  }, [props.children])

  const [hoverStatus, setHover] = useState(false)
  return (
    <Tooltip
      title={props.title ? props.title : props.children === undefined || props.children === null ? '' : props.children}
      classes={{ tooltip: classes.w640 }}
      interactive={props.interactive || false}
      PopperProps={{
        popperOptions: {
          placement: props.placement || 'top',
          modifiers: {
            offset: {
              offset: props.offset || '0, 0',
            },
          },
        },
      }}
      disableHoverListener={!hoverStatus}>
      <Text
        ref={textElementRef}
        className={props.className}
        style={{
          WebkitLineClamp: props.lineClamp,
          height: props.height,
          width: props.width,
        }}>
        {props.children}
      </Text>
    </Tooltip>
  )
}

export default OverflowTooltip
