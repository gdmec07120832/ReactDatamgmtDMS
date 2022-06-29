import { useEffect, useRef } from 'react'
import axios from '../../../../utils/axios'

export default function useValueType (cb) {
  const valueType = useRef([])
  useEffect(() => {
    axios.get('bi-data-reporting/api/user/mis/getEnumType', {
      params: {
        cls: 'excel_ExcelColumnType'
      }
    }).then(({ data: { excel_ExcelColumnType } }) => {
      valueType.current = excel_ExcelColumnType
      cb?.()
    })
    // eslint-disable-next-line
  }, [])
  return valueType
}
