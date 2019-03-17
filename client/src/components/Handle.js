import React from "react";
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  handleDiv: {
    position: 'absolute',
    marginLeft: -6, // -10,
    marginTop: 20, // 30 
    zIndex: 2,
    width: 12, // 20
    height: 12, // 20
    border: 0,
    textAlign: 'center',
    cursor: 'pointer',
    borderRadius: '50%',
    backgroundColor: theme.palette.secondary.main,
    color: '#333',
  },
  handleLabel: {
    fontFamily: 'Roboto', 
    fontSize: 11, 
    marginTop: -15
  }
})

const Handle = ({ handle: { id, value, percent }, getHandleProps, classes}) => {
  return (
    <div
      className={classes.handleDiv}
      style={{ left: `${percent}%` }}
      {...getHandleProps(id)}
    >
      <div className={classes.handleLabel}>
        {value}
      </div>
    </div>
  )
}

export default withStyles(styles, { withTheme: true })(Handle);