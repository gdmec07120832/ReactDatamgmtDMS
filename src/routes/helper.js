import Loadable from '@docusaurus/react-loadable'
import CompLoading from '../components/CompLoading'

const loadComp = (loader) => {
  return Loadable({
    loader,
    loading: CompLoading
  })
}



export {
  loadComp
}
