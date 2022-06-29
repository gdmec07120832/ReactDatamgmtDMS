function CompLoading({error, retry, pastDelay}) {
  if (error) {
    return <div className={'p-6'}> 网络错误或者页面有更新！
      你可以
      <button onClick={retry}>重试</button>
      或者
      <button onClick={() => {
        window.location.reload()
      }}>刷新页面</button>
    </div>
  } else if (pastDelay) {
    return <div className={'p-6'}>Loading...</div>
  } else {
    return null
  }
}

export default CompLoading
