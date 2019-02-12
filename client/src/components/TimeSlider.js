import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import Slider from '@material-ui/lab/Slider';
import Typography from '@material-ui/core/Typography';
import moment from 'moment';
import externalStyles from '../scripts/styleVariables';
import _LinearScale from 'react-compound-slider/Slider/LinearScale';
import { Ticks } from "react-compound-slider";
import Tick from './Tick';
import { formatDateTime } from '../scripts/formatDateTime';

import IconButton from '@material-ui/core/IconButton';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';

const scale = new _LinearScale();
const drawerWidth = externalStyles.drawerWidth;
const drawerWidthNarrow = externalStyles.drawerWidthNarrow; // for small viewports (< 600px)
const timeSliderMargin = externalStyles.timeSliderMargin;

// TODO: move slider percent width to external style sheet and use direct media
// queries to get sizing correct

const styles = theme => ({
  sliderDiv: {
    position: 'absolute',
    bottom: 0,
    left: 0, 
    width: '400px',
    margin: timeSliderMargin,
    zIndex: 500,
    overflow: 'hidden',
    borderRadius: '2px',
    backgroundColor: theme.palette.primary.main,
    transition: theme.transitions.create(['left', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    [`${theme.breakpoints.down('sm')}`]: { 
      width: `calc(100% - ${timeSliderMargin*2}px)`,
    },
  },
  sliderDivShift: {
    left: drawerWidth,
    transition: theme.transitions.create(['left'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    [`${theme.breakpoints.down('sm')}`]: {
      left: drawerWidthNarrow,
      width: `calc(100% - ${drawerWidthNarrow}px - ${timeSliderMargin*2}px)`,
    }, 
  },
  slider: {
    padding: '22px 0',
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
  },
  dateTimeExtreme: {
    display: 'inline-block',
    fontSize: 13
  },
  sliderTicks: {
    zIndex: 500,
    height: 30,
    marginTop: '-15px',
    position: 'relative'
  },
  sliderHide: {
    [`${theme.breakpoints.down('xs')}`]: { 
      display: 'none', 
    }
  },
  resetButton: {
    position: 'absolute',
    color: 'gray',
    right: 0,
    padding: '3px 12px',
    '&:hover': {
      cursor: 'pointer',
      fontWeight: 'bold'
    }
  },  
  timeAdjustButton: {
    alignSelf: 'flex-start'
  }
});

function TimeSlider(props) {

  const handleChange = (event, value) => {
    props.handleTimeChange(value);
  };

  const handleReset = () => {
    // present UTC time
    props.handleTimeChange(moment.utc().startOf('hour').valueOf());
  }

  const incrementTime = () => {
    // add 1 hour
    props.handleTimeChange(moment(props.mapTime).add(1,'h').startOf('hour').valueOf());
  }

  const decrementTime = () => {
    // add 1 hour
    props.handleTimeChange(moment(props.mapTime).subtract(1,'h').startOf('hour').valueOf());
  }
  
  const constructTickValueArray = (startTime, endTime, timeInterval) => {
    let currentTime = startTime, tickValueArray = [startTime];

    while (currentTime <= (endTime - timeInterval)) {
      currentTime += timeInterval;
      tickValueArray.push(currentTime);
    }
    tickValueArray.push(endTime);
    return tickValueArray;
  }

  const { classes, open, startTime, endTime, mapTime} = props;
  scale.domain = [startTime, endTime]

  let tickVals = constructTickValueArray(startTime, endTime, 3600000*24*3);
  return (     
    <div className={classNames(classes.sliderDiv, {
      [classes.sliderDivShift]: open, [classes.sliderHide]: open
      })}>
        <span 
          onClick={handleReset} 
          className={classes.resetButton}> 
          reset 
        </span>
        <Typography 
          style={{textAlign: 'center'}} 
          id="label">
            {formatDateTime(mapTime,'YYYY-MM-DD HH:mm',' UTC')}
        </Typography>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <IconButton aria-label="back" title='-1 hr'>
            <RemoveCircleOutlineIcon onClick={decrementTime}/>
          </IconButton>
          <div style={{flexGrow: 1}}>
            <Slider
              classes={{
                container: classes.slider, 
                thumb: classes.sliderThumb,
                trackBefore:  classes.sliderTrackBefore,
                trackAfter: classes.sliderTrackAfter 
              }}
              value={mapTime}
              min={startTime}
              max={endTime}
              step={3600000}
              onChange={handleChange}
            />

            <Ticks scale={scale} count={4} values={tickVals}>
              {({ ticks }) => (
                <div className={classes.sliderTicks}>
                {ticks.map((tick, index) => (
                  <Tick key={index} tick={tick} count={ticks.length} />
                ))}
                </div>
              )}
            </Ticks>
          </div>
          <IconButton aria-label="back" title='+1 hr'>
            <AddCircleOutlineIcon onClick={incrementTime}/>
          </IconButton>
      </div>
    </div> 
  );
}

// https://codesandbox.io/s/plzyr7lmj (how to do ticks)
// import { ticks } from 'd3-array'
// fix Ticks.js so we don't need to use 'scale'

TimeSlider.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(TimeSlider);
