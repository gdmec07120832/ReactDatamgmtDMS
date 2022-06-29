import React from 'react';
import DesignAll from './DesignAll';

function MetricsDesign() {
    return (
        <div className={'px-6 pb-6'} style={{height: 'calc(100vh - 135px)'}}>
            <DesignAll isEdit={true} />
        </div>
    );
}

export default MetricsDesign;