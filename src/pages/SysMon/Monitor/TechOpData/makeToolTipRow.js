const makeTooltipRow = (row, titleWidth = 'auto') => {
  return `
    <div class="flex justify-between" style="line-height: 24px">
        <div style="flex: 0; flex-basis: ${titleWidth}; width: ${titleWidth}">
            ${row.marker}
            <span>${row.seriesName}</span>
        </div>
        <div class="font-bold">${row.value}</div>   
    </div> 
  `
}

export default makeTooltipRow

