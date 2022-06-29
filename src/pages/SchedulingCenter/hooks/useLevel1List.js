import {useState} from 'react';
import {useRequest} from 'ahooks';
import axios from '../../../utils/axios';

const useLevel1List = () => {
  const [level1List, setLevel1List] = useState([])
  useRequest(() => {
    return axios.get('/bi-task-scheduling-system/api/user/common/listLevelOnesForComboBox').then(({ data }) => {
      setLevel1List(
          data.map((item) => {
            return {
              label: item.hierarchy,
              value: item.id,
            }
          })
      )
    })
  })
  return level1List
}

export default useLevel1List

