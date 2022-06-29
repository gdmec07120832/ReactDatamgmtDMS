import numeral from 'numeral';

export default function formatterTooltip(params, format='0,0') {
  const name = params[0].name
  const rows = params
      .map((item) => {
        return `<div style="display: flex; width: 150px; line-height: 1.8">
                      <div style="flex: 0">${item.marker.replace(/border-radius:10px/, 'margin-right: 5px')}${item.seriesName}</div>
                    <div style="flex: 1; text-align: right">${numeral((item.value)).format(format).replace(/\.0+$/, '')}</div></div>`
      })
      .join('')
  const total = params.reduce((acc, cur) => {
    return acc + cur.value
  }, 0)
  const totalHtml = `<div style="display: flex; width: 150px; line-height: 1.8">
                                <div style="flex: 0">合计</div>
                                <div style="flex: 1; text-align: right">${numeral(total).format(format).replace(/\.0+$/, '')}</div></div>`
  return `${name}${rows}${totalHtml}`
}