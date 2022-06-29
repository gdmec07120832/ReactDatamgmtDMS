import React, {useEffect, useState} from 'react';
import axios from '../../../../utils/axios';

function AppMo() {
  const [url, setUrl] = useState()
  useEffect(() => {
    axios.get('/bi-sys/api/admin/appMonitor/getAppMonitorList').then(({data: [{value}]}) => {
      setUrl(value)
    })
  }, [])
  return (
      <div style={{height: 'calc(100vh - 138px)'}}>
        <iframe title={'监控'} src={url} frameBorder={0} width={'100%'} height={'100%'} />
      </div>
  );
}

export default AppMo;