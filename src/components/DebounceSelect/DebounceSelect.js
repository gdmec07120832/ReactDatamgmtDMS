import React, { useEffect } from 'react'
import { Empty, Select, Spin } from 'antd'
import debounce from 'lodash/debounce'

function DebounceSelect ({ fetchOptions, debounceTimeout = 200, ...props }) {
  const [fetching, setFetching] = React.useState(false)
  const [options, setOptions] = React.useState([])
  const fetchRef = React.useRef(0)
  const debounceFetcher = React.useMemo(() => {
    const loadOptions = (value) => {
      fetchRef.current += 1
      const fetchId = fetchRef.current
      setOptions([])
      setFetching(true)
      fetchOptions(value).then((newOptions) => {
        if (fetchId !== fetchRef.current) {
          // for fetch callback order
          return
        }

        setOptions(newOptions)
        setFetching(false)
      })
    }

    return debounce(loadOptions, debounceTimeout)
  }, [fetchOptions, debounceTimeout])
  /*eslint-disable-next-line */
  useEffect(() => {debounceFetcher()}, [])
  return (
    <Select
      filterOption={false}
      showSearch
      onSearch={debounceFetcher}
      notFoundContent={fetching ? <div className={'text-center'}><Spin size="small"/></div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}/>}
      {...props}
      dropdownRender={menu => (
        <div>
          {menu}
          {
            options.length === 100 ? <div className={'text-center'}>
              只展示前100条, 可搜索查找
            </div> : null
          }
        </div>
      )}
      options={options}
    />
  )
}

export default DebounceSelect
