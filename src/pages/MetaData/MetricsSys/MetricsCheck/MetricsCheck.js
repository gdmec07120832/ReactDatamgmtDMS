import React from 'react'
import DesignAll from '../MetricsDesign/DesignAll'
import { useLastLocation } from 'react-router-last-location'
import { Redirect, useLocation } from 'react-router-dom'

function MetricsCheck() {
  const location = useLocation()
  const lastLocation = useLastLocation()

  return (
    <div className={'px-6 pb-6'} style={{height: 'calc(100vh - 135px)'}}>
      {lastLocation?.pathname !== '/metaData/metricsSys/metricsViewIntro' || !location?.state?.tab ? (
        <Redirect to={'/metaData/metricsSys/metricsViewIntro'} />
      ) : (
        <DesignAll isEdit={false} defaultTabName={location?.state?.tab} />
      )}
    </div>
  )
}

export default MetricsCheck
