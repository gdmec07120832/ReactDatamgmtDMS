import {makeStyles} from '@material-ui/core/styles';

const IMPORT_STATE = {
  NotImported: '未导入',
  Imported: '已导入',
  ReImported: '已重新导入',
  RemoveImported: '已删除导入数据',
  TempTableDelete: '临时表已删除',
  TempTableImporting: '临时表导入中',
  TempTableImportFailed: '临时表导入失败',
  TempTableImportFinish: '临时表导入完成',
}

const FILL_IN_STATE = {
  FillInTheImport: '待填报',
  FillInTheAudit: '填报审批',
  FillInComplete: '填报完成',
  FillInReject: '填报不通过',
}

const transDaysOfWeek = (num) => {
  return ({1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '日'})[num]
}

const tranFrequency = (frequency, type, details, fallback = '') => {
  const {cutTime, daysOfMonth, daysOfWeek, monthOfYear} = details || {}
  if (frequency) {
    if (frequency === 'AnyTime') {
      return '按需'
    } else {
      // Frequency
      const ret = { Daily: '每日', Weekly: '每周', Monthly: '每月', Yearly: '每年' }[type]
      switch (type) {
        case 'Yearly':
          return `${ret}${monthOfYear}月${daysOfMonth}号 ${cutTime}`
        case 'Monthly':
          return `${ret}${daysOfMonth}号 ${cutTime}`
        case 'Weekly':
          return `${ret}周${transDaysOfWeek(daysOfWeek)} ${cutTime}`
        case 'Daily':
          return `${ret} ${cutTime}`
        default:
          return ''
      }
    }
  } else {
    return fallback
  }
}

const useExpandTableStyle = makeStyles({
  expandInnerTable: {
    '& .ant-table': {
      color: 'rgba(0, 0, 0, .4)',
      fontSize: '13px',
      background: '#fafafa'
    },
    '& .ant-table-thead th.ant-table-cell': {
      paddingTop: '2px!important',
      fontSize: '13px!important',
      color: 'rgba(0,0,0,.7)',
      paddingBottom: '2px!important',
    },
  },
})


const previewDoc = (src) => {
  const prefix = window.location.origin

  const _src = /^http/.test(src) ? src : prefix + src
  let url = 'http://documents.linshimuye.com/op/view.aspx?src=' + encodeURIComponent(_src)
  console.log(url)
  window.open(url)
}

export { IMPORT_STATE, FILL_IN_STATE, tranFrequency, useExpandTableStyle, previewDoc }
