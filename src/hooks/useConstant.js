import { useEffect, useState } from 'react'
import axios from '../utils/axios'

export default function useConstant(type) {
  const [constant, setConstant] = useState([])
  useEffect(() => {
    axios
      .get('/bi-sys/api/user/sysConstant/findDictByConstantType', {
        params: { constantType: type },
      })
      .then(({ data }) => {
        setConstant(
          data.map((item) => ({
            ...item,
            label: item.key
          }))
        )
      })
  }, [type])
  return constant
}
