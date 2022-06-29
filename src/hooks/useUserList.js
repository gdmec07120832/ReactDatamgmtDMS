import { useEffect, useState } from 'react'
import {useDispatch, useSelector} from 'react-redux';
import axios from '../utils/axios'

export default function useUserList () {
  const [userList, setUserList] = useState([])
  const storedUserList = useSelector(state => state.list.userList)
  const dispatch = useDispatch()
  useEffect(() => {
    if(!storedUserList?.length) {
      axios.get('/bi-sys/api/user/biSysUser/findAllInfo').then(({ data }) => {
        setUserList(data)
        dispatch({
          type: 'set_userList',
          payload: data
        })
      })
    } else {
     setUserList(storedUserList)
    }
  }, [storedUserList, dispatch])
  return userList
}
