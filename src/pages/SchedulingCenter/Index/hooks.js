import {useState} from 'react';
import {useRequest} from 'ahooks';
import axios from '../../../utils/axios';

export const useStatisticCounts = () => {
  const [statisticCounts, setStatisticCounts] = useState({})
  const { run: getStatistic } = useRequest(() => {
    return axios.get('/bi-task-scheduling-system/api/user/common/getTodayStatisticsData').then(({ data: [ret] }) => {
      setStatisticCounts({
        WAIT_EXEC: ret.waitForPushNum,
        DEP_WAIT: ret.waitForExecuteNum,
        RUNNING: ret.runningNum,
        TODAY_OVERTIME: ret.timeOutNum,
        TODAY_FAILED: ret.failureNum,
        TODAY_SUCCESS: ret.successNum,
        TOTAL: ret.jobSumCount,
      })
    })
  })

  return {
    statisticCounts,
    getStatistic
  }
}