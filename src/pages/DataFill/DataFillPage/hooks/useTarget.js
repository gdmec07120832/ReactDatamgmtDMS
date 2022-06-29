import { useEffect, useState } from 'react'
import axios from '../../../../utils/axios'

export default function useTarget () {
  const [targetList, setTargetList] = useState([])
  useEffect(() => {
    axios.get('bi-data-reporting/api/user/mis/misSyncTarget/findAll').then(({ data }) => {
      setTargetList(data)
    })

  }, [])
  return targetList
}
