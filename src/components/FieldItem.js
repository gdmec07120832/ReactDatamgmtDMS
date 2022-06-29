import React from 'react'
import PropTypes from 'prop-types'
import {makeStyles} from '@material-ui/core/styles'

const useStyles = makeStyles({
  itemLabelText: {
    flexGrow: 0,
    flexShrink: 0,
    textAlign: 'right',
    marginRight: 10,
    '& .labelInnerText': {
      position: 'relative',

      '&.required::after': {
        color: 'red',
        content: '"*"',
        left: -10,
        position: 'absolute'
      }
    }
  }
})

function FieldItem(props) {
  const classes = useStyles()
  const {label, labelWidth, labelAlign} = props
  return (
    <div>
      <div className={'flex flex-start'}>
      <span className={classes.itemLabelText}
            style={{flexBasis: labelWidth ?? 80, textAlign: labelAlign === 'left' ? 'left' : 'right'}}>
        <span className={`${props.required ? 'required' : ''} labelInnerText`}>{label}</span>
      </span>
        {props.children}
      </div>
    </div>
  )
}

FieldItem.propTypes = {
  required: PropTypes.bool,
  label: PropTypes.string.isRequired,
  labelWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  labelAlign: PropTypes.oneOf(['left', 'right'])
}

export default FieldItem

