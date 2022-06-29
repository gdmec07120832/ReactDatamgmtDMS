export function refreshScopeString (type, value) {
  switch (type) {
    case 0:
      return '全量刷新'
    case 1:
      return `前${value}天至今`
    case 2:
      return `前${value}月至今`
    case 3:
      return `前${value}年至今`
    case 4:
      return '本月'
    case 5:
      return '上月'
    case 6:
      return `次月${value}号冻结`
    case 7:
      return `${value}`
    default:
      return '--'
  }
}

export function refreshRateString ({
  exCycle, timeInterval, timeIntervalUnit,
  timeOfDay, dayOfWeek, dayOfMonth, monthOfYear, diyExCycle
}) {
  switch (exCycle) {
    case 0:
      if (timeInterval) {
        return `每天间隔${timeInterval}${(['秒', '分钟', '小时'])[timeIntervalUnit]}`
      }
      if (timeOfDay) {
        return `每天${timeOfDay}`
      }
      return '每天'
    case 1:
      return `每周${(['一', '二', '三', '四', '五', '六', '天'])[(dayOfWeek ?? 0) - 1] || '?'}`
    case 2:
      return `每月${dayOfMonth ?? '?'}号`
    case 3:
      return `每年${monthOfYear ?? '?'}月`
    case 4:
      return `${diyExCycle}`
    default:
      return '--'
  }
}


