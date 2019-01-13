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
});

function LoadingSpinner(props) {
  const { classes } = props;

  return (
    <React.Fragment>
      <div className={classNames('loader', 'small', classes.customSpinner)}></div>
    </React.Fragment>
  )
}

export default withStyles(styles, { withTheme: true })(LoadingSpinner);

/*
{props['mapLayers'][layer['id']]['isLoading'] && 
  <div className="loader small" style={{'display': 'inline-block', 'marginRight': 5}}></div>
}
*/