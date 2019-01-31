import React from 'react';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  customSpinner: {
    display: 'inline-block',
    marginRight: 5,
    border: '2px solid lightgray',
    borderTop: `2px solid ${theme.palette.secondary.main}`,
    borderBottom: `2px solid ${theme.palette.secondary.main}`
  },
  customSpinnerLarge: {
    display: 'block',
    margin: 'auto',
    width: 50,
    height: 50
  }
});

function LoadingSpinner(props) {
  const { classes } = props;

  return (
    <React.Fragment>
      <div className={classNames('loader', {'small': props.largeStyle}, 
        classes.customSpinner, {[classes.customSpinnerLarge]: props.largeStyle})}></div>
    </React.Fragment>
  )
}

LoadingSpinner.defaultProps = {
  largeStyle: false
};

export default withStyles(styles, { withTheme: true })(LoadingSpinner);
