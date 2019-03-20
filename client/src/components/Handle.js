import React from "react";
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  handleDiv: {
    position: 'absolute',
    marginLeft: -6,
    marginTop: 20, 
    zIndex: 2,
    width: 12,
    height: 12,
    border: 0,
    textAlign: 'center',
    cursor: 'pointer',
    borderRadius: '50%',
    backgroundColor: theme.palette.secondary.main,
    color: '#333',
    // [`${theme.breakpoints.down('xs')}`]: { 
    //   marginTop: 14,
    //   marginLeft: -12,
    //   width: 24,
    //   height: 24,
    // }, 
  },
  handleLabel: {
    fontFamily: 'Roboto', 
    fontSize: 13, 
    marginTop: -17
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