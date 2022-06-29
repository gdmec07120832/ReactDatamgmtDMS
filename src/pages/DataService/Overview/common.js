export const commonOptions = {
  tooltip: {
    trigger: 'axis',
  },
  grid: {
    top: 30,
    left: 0,
    right: 0,
    bottom: 0,
    containLabel: true,
  },
  yAxis: [
    {
      splitLine: {
        show: true,
      },
      minInterval: 1,
      scale: true,
    },
    {
      splitLine: {
        show: false,
      },
    },
  ],
}