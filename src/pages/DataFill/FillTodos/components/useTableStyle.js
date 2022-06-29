const {makeStyles} = require('@material-ui/core');
const useTableStyle = makeStyles({
  root: {
    padding: '0 24px 20px 24px',
    '& .ant-table-thead .ant-table-cell': {
      fontSize: '15px!important',
      paddingTop: '12px!important',
      paddingBottom: '12px!important',
      fontWeight: 'normal!important',
      color: 'rgba(0,0,0,.5)'
    }
  }
})

export default useTableStyle