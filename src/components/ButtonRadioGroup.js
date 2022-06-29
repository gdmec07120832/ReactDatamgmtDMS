import React from 'react'
import classNames from 'classnames'
import styled from 'styled-components'

const ButtonRadioGroupContext = React.createContext(null)
const Wrapper = styled.div`
  display: inline-block;
  height: 32px;
  padding: 2px;
  background: #f1f1f1;
  border-radius: 2px;
  border: 1px solid #e9e9e9;
`
const ButtonRadioGroup = (props) => {
  const { value, children, onChange } = props
  const handleChange = (v) => {
    onChange?.(v)
  }
  return (
    <ButtonRadioGroupContext.Provider
      value={{
        onChange: handleChange,
        value,
      }}>
      <Wrapper>{children}</Wrapper>
    </ButtonRadioGroupContext.Provider>
  )
}

const RadioItem = styled.div`
  display: inline-flex;
  line-height: 26px;
  padding-left: 12px;
  padding-right: 12px;
  overflow: hidden;
  border-radius: 2px;
  color: #666;
  &:hover {
    cursor: pointer;
    background: rgba(46, 50, 56, 0.09);
  }
  &.active {
    background: #fff;
    color: #333;
  }
`

ButtonRadioGroup.Radio = function Radio(props) {
  const { value, children } = props
  const context = React.useContext(ButtonRadioGroupContext)
  const handleClick = () => {
    context?.onChange?.(value)
  }
  return (
    <>
      <RadioItem className={classNames({ active: context?.value === value })} onClick={handleClick}>
        {children}
      </RadioItem>
    </>
  )
}

export default ButtonRadioGroup
