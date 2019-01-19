import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  root: {
    ...theme.mixins.gutters(),
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
    fontSize: '0.75rem',
    fontWeight: 400
  },
});

function LegendContainer(props) {
  const { classes } = props;

  return (
    <div>
      <Paper className={classes.root} elevation={1}>
        {props.children}
      </Paper>
    </div>
  );
}

LegendContainer.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(LegendContainer);