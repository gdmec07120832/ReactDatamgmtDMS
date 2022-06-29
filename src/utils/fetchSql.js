import instance from './axios'

const fetchSql = (prefix, interfaceName, data) => {
  return instance.post(`/bi-mobile/api/user/data/${prefix}/${interfaceName}/get`, data)
}

export default fetchSql
