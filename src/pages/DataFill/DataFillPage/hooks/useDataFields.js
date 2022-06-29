import { useEffect, useState } from 'react'
import axios from '../../../../utils/axios'

export default function useDataFields () {
  const [dataFields, setDataFields] = useState([])
  useEffect(() => {
    axios.get('/bi-metadata/api/user/kpiNode/queryLevelInfo', {
      params: {
        contains: true,
        level: 1
      }
    }).then(({ data }) => {
      setDataFields(data.map(item => {
        return {
          ...item,
          label: item.nodeName,
          value: item.id
        }
      }))
    })

  }, [])
  return dataFields
}