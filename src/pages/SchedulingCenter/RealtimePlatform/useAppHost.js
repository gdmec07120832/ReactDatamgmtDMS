import {useEffect, useState} from 'react';
import useConstant from '../../../hooks/useConstant';

export default function useAppHost() {
  const [host, setHost] = useState()
  const list = useConstant('controller_url')
  useEffect(() => {
    if(list && list.length) {
      setHost(list.find(item => item.key === 'dlink-remote-url')?.value)
    }
  }, [list])

  return host
}