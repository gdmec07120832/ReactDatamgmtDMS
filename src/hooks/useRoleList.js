import {useEffect, useState} from 'react';
import axios from '../utils/axios';

const useRoleList = function () {
  const [roleList, setRoleList] = useState([])
  useEffect(() => {
    axios.get('/bi-sys/api/user/biSysUser/queryRoles', {
      params: {
        roleName: ''
      }
    }).then(({ data }) => {
      setRoleList(data)
    })
  }, [])
  return roleList
}


export default useRoleList