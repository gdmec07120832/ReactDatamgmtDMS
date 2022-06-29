import React, { useEffect, useState } from 'react'
import { Popover } from '@material-ui/core'
import { CloseCircleOutlined } from '@ant-design/icons'

function MaintainInfo(props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const show = localStorage.getItem('showMetricsMaintainInfo')
    setTimeout(() => {
      if (!show) {
        setOpen(true)
      }
    }, 500)
  }, [])

  const handleDismiss = () => {
    setOpen(false)
    localStorage.setItem('showMetricsMaintainInfo', 'false')
  }

  return (
    <Popover
      open={open}
      PaperProps={{
        style: {
          boxShadow: '0px 10px 24px 0px rgba(37, 97, 239, 0.45)',
        },
      }}
      elevation={0}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 75,
        horizontal: 'center',
      }}
      {...props}>
      <div className={'p-4 space-x-4 text-white'} style={{background: 'var(--primary-color)'}}>
        <span>
          <b>备注</b>：当前指标信息为样例数据，将在22年全盘整理。
        </span>
        <span className={'cursor-pointer text-white hover:underline'} onClick={handleDismiss}>
          不再提示
        </span>
        <CloseCircleOutlined
          className={'cursor-pointer'}
          onClick={() => setOpen(false)}
        />
      </div>
    </Popover>
  )
}

export default MaintainInfo
