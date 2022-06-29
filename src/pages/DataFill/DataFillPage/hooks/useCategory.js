import { useEffect, useState } from 'react'
import axios from '../../../../utils/axios'

export default function useCategory () {
  const [cateList, setCateList] = useState([])
  useEffect(() => {
    axios.get('bi-data-reporting/api/user/excel/excelCategory/findAll').then(({ data }) => {
      setCateList(data)
    })

  }, [])
  return cateList
}
