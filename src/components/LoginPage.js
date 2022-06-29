import React  from 'react'
import styles from './LoginPage.module.css'

function LoginPage () {
  return (
    <div className={`${styles.LoginPage} flex justify-center`}>
      <div className={styles.formArea}>
        <div style={{ backgroundColor: '' }}>
          <img style={{ height: '100%', width: '100%' }}
               src={require('../assets/images/login-form-image.svg').default}
               alt=""/>
        </div>
        <div className={styles.LoginForm}>
          <h4 className={styles.LoginFont} onClick={() => window.location.replace('/')}>林氏木业数据管理系统</h4>
          <div className={styles.formInputs} style={{ width: '75%' }}>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
