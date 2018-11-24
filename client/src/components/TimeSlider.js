import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import Slider from '@material-ui/lab/Slider';
import Typography from '@material-ui/core/Typography';

const drawerWidth = 340;
const drawerWidthNarrow = 280; // for small viewports (< 600px)

const styles = theme => ({
  sliderDiv: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    // width: `calc(100% - 20px)`,
    width: '400px',
    margin: 10,
    zIndex: 500,
    overflow: 'hidden',
    borderRadius: '2px',
    backgroundColor: theme.palette.primary.main,
    transition: theme.transitions.create(['left', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  sliderDivShift: {
    left: drawerWidth,
    // width: `calc(100% - ${drawerWidth}px - 20px)`,
    transition: theme.transitions.create(['left', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  sliderRoot: {
    padding: '0 20px',
  },
  slider: {
    padding: '22px 10px',
    backgroundColor: theme.palette.primary.main
  },
  sliderTrackBefore: {
    backgroundColor: theme.palette.secondary.main
  },
  sliderTrackAfter: {
    backgroundColor: 'black'
  },
  sliderThumb: {
    backgroundColor: theme.palette.secondary.main,
  }
});

class TimeSlider extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      value: 3,
    };

    // this.handleDrawerOpen = this.handleDrawerOpen.bind(this);
    // this.handleDrawerClose = this.handleDrawerClose.bind(this);
  }

  handleChange = (event, value) => {
    this.setState({ value });
  };


  componentDidMount() {
    console.log('drawer component mounted');
  }

  render() {
    const { classes, theme } = this.props;
    let open = this.props.open;

    return (     
      <div className={classNames(classes.sliderDiv, {
        [classes.sliderDivShift]: open,
      })}>
        <Typography id="label">Slider label</Typography>
        <Slider
          classes={{
            container: classes.slider, thumb: classes.sliderThumb,
            root: classes.sliderRoot,
            trackBefore:  classes.sliderTrackBefore,
            trackAfter: classes.sliderTrackAfter 
          }}
          value={this.state.value}
          min={0}
          max={6}
          step={1}
          onChange={this.handleChange}
        />
      </div> 
    );
  }
}


TimeSlider.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(TimeSlider);
