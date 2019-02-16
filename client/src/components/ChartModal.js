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
import MetOceanProfile from './MetOceanProfile';
import withMobileDialog from '@material-ui/core/withMobileDialog';

const styles = theme => ({
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
  };

  handleClose = () => {
    this.setState({ open: false }, () => {
      this.props.closeChartModal();
    });
  };

  buildChartObj = () => {
    if (this.props.chartType === 'timeseries') {
      return (
        <MetOceanTimeseries 
          chartData={this.props.chartData}
          activeLocation={this.props.activeLocation}
          chartLoadingErrors={this.props.chartLoadingErrors}
        />
      )
    } else {
      return (
        <MetOceanProfile 
          chartData={this.props.chartData}
          activeLocation={this.props.activeLocation}
          chartLoadingErrors={this.props.chartLoadingErrors}
        />
      )
    }
  }

  render() {
    const { classes, fullScreen } = this.props;
    let isTimeseries = this.props.chartType === 'timeseries';
    return (
      <React.Fragment>
        <Dialog
          fullScreen={fullScreen}
          fullWidth={true}
          maxWidth={'lg'}
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
              </React.Fragment> :  
              this.buildChartObj()
            }
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose} style={{backgroundColor: 'lightgray'}}>
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

const StyledModal = withStyles(styles, { withTheme: true })(ChartModal);
export default withMobileDialog({breakpoint: 'sm'})(StyledModal);
