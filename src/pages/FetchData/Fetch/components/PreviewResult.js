import React from 'react'
import DraggableModal from '../../../../components/DraggableModal'
import AliBaseTable from '../../../../components/AliBaseTable'
import { features, useTablePipeline } from 'ali-react-table'

function PreviewResult(props) {
  const { result, visible, setVisible } = props
  const columns = Object.keys(result[0] || {}).map((key) => {
    return {
      name: key,
      code: key,
    }
  })

  const pipeline = useTablePipeline()
    .input({ dataSource: result, columns: columns })
    .use(
      features.columnResize({
        fallbackSize: 120,
        handleBackground: '#ddd',
        handleHoverBackground: '#aaa',
        handleActiveBackground: '#89bff7',
      })
    )


  return (
    <DraggableModal width={'60vw'} visible={visible} title={'结果预览（只展示前100条）'} onCancel={() => setVisible(false)} footer={null}>
      <AliBaseTable
        {...pipeline.getProps()}
        useVirtual={true}
        useOuterBorder
        emptyCellHeight={352}
        style={{ height: 396, overflow: 'auto' }}
      />
    </DraggableModal>
  )
}

export default PreviewResult
