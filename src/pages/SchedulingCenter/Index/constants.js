export const OVERVIEW_STATUS_LIST = [
  'TOTAL',
  'RUNNING',
  'DEP_WAIT',
  'WAIT_EXEC',
  'TODAY_SUCCESS',
  'TODAY_FAILED',
  'TODAY_OVERTIME',
]

export const ICON_MAP = {
  WAIT_EXEC: require('./icons/icon04.png').default,
  DEP_WAIT: require('./icons/icon03.png').default,
  RUNNING: require('./icons/icon02.png').default,
  TODAY_OVERTIME: require('./icons/icon07.png').default,
  TODAY_FAILED: require('./icons/icon06.png').default,
  TODAY_SUCCESS: require('./icons/icon05.png').default,
  TOTAL: require('./icons/icon01.png').default,
}

export const STATUS = {
  WAIT_EXEC: '等待执行',
  DEP_WAIT: '等待依赖',
  RUNNING: '正在运行',
  TODAY_OVERTIME: '今日超时',
  TODAY_FAILED: '今日失败',
  TODAY_SUCCESS: '今日成功',
  TOTAL: '作业总数',
}