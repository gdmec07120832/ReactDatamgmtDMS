import styled from 'styled-components';
import {DatePicker} from 'antd';

const StyledDateRangePicker = styled(DatePicker.RangePicker)`
  width: 220px;
  .ant-picker-suffix {
    display: none;
  }
  
  .ant-picker-input input {
    text-align: center;
  }
`

export default StyledDateRangePicker
