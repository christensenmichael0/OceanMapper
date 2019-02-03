import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import LoadingSpinner from './LoadingSpinner';
import MetOceanTimeseries from './MetOceanTimeseries';

const styles = theme => ({
  form: {
    display: 'flex',
    flexDirection: 'column',
    margin: 'auto',
    width: 'fit-content',
  },
  formControl: {
    marginTop: theme.spacing.unit * 2,
    minWidth: 120,
  },
  formControlLabel: {
    marginTop: theme.spacing.unit,
  },
  loadingText: {
    display: 'block',
    fontSize: 16,
  },
  loadingContent: {
    textAlign: 'center'
  }
});

class ChartModal extends React.Component {
  state = {
    open: true,
    fullWidth: true,
    maxWidth: 'lg',
  };

  handleClickOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
    this.setState({ open: false }, () => {
      this.props.closeChartModal();
    });
  };

  handleMaxWidthChange = event => {
    this.setState({ maxWidth: event.target.value });
  };

  handleFullWidthChange = event => {
    this.setState({ fullWidth: event.target.checked });
  };

  render() {
    const { classes, theme } = this.props;
    // this.props.chartLoading
    return (
      <React.Fragment>
        <Dialog
          fullWidth={this.state.fullWidth}
          maxWidth={this.state.maxWidth}
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="max-width-dialog-title"
        >
          <DialogContent className={classNames({[classes.loadingContent]: this.props.chartLoading})}>
            {this.props.chartLoading ? 
              <React.Fragment>
                <LoadingSpinner largeStyle={true}/>
                <Typography className={classes.loadingText} variant="overline" gutterBottom>
                  Fetching Data
                </Typography>
              </React.Fragment> :  <MetOceanTimeseries chartData={this.props.chartData}/>}
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose} color={theme.palette.secondary.light}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </React.Fragment>
    );
  }
}

ChartModal.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(ChartModal);