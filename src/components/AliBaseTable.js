import styled from 'styled-components';
import {BaseTable} from 'ali-react-table';

const MyBaseTable = styled(BaseTable)`
  & {
    --row-height: 36px;
  }
  & .resize-handle {
    width: 4px;
    right: -2px;
  }

  &,
  .art-horizontal-scroll-container {
    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }

    ::-webkit-scrollbar-thumb {
      background: #ccc;
      border: 1px solid #eaeaea;

      &:hover {
        background: #6e6e6e;
      }
    }

    ::-webkit-scrollbar-track {
      background: #eaeaea;
    }
  }
`

export default MyBaseTable