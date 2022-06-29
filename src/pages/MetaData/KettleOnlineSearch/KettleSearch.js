import React from 'react'

const url =
  process.env.REACT_APP_RELEASE_ENV === 'pro'
    ? 'http://dm.bi.linshimuye.com:9060/spoon/spoon'
    : 'http://10.10.14.67:8100/spoon/spoon'
function KettleSearch() {
  return (
    <>
      <iframe className={''} title={'spoon'} width={'100%'} frameBorder={0} height={820} src={url} />
    </>
  )
}

export default KettleSearch
