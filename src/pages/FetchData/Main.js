import React, {useEffect, useRef, useState} from 'react';
import axios from '../../utils/axios';
import {useDispatch} from 'react-redux';
import validFields from './validFields';

const FieldsContext = React.createContext([])
function Main({children}) {
  const [fields, setFields] = useState([])
  const dispatch = useDispatch()
  const count = useRef(0)
  useEffect(() => {
   count.current = 1
    axios.get('/bi-data-fetch/api/user/notification/getDownloadTaskCount').then(({data}) => {
      dispatch({
        type: 'set_menuBadges',
        payload: {
          'fetchData-download': data
        }
      })
    })
  }, [dispatch])

  useEffect(() => {
    axios.get('/bi-metadata/api/user/kpiNode/queryLevelInfo?contains=true&level=1').then(({data}) => {
      setFields(data.filter((item) => {
        return validFields.includes(item.nodeName)
      }))
    })
  }, [])

  return (
      <FieldsContext.Provider value={fields}>
        {children}
      </FieldsContext.Provider>
  );
}

export {FieldsContext}
export default Main;