import axios from '../../utils/axios';


export const fetchDataFields = () => {
  return axios
      .get('/bi-metadata/api/user/kpiNode/queryLevelInfo', {
        params: {
          contains: true,
          level: 1,
        },
      })
      .then(({ data }) => {
        return data
      })
}

export const fetchLevelInfo = (level) => {
  return axios.get('/bi-data-reporting/api/user/excel/excelCategory/queryLevelInfo', {
    params: {level}
  }).then(({data}) => {
    return data.map(item => {
      return {
        ...item,
        label: item.name,
        value: item.id
      }
    })
  })
}
