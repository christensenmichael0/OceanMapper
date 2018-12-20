import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import Slider from '@material-ui/lab/Slider';
import Typography from '@material-ui/core/Typography';
import externalStyles from '../scripts/styleVariables';
import _LinearScale from 'react-compound-slider/Slider/LinearScale';
import { Ticks } from "react-compound-slider";
import Tick from './Tick';
import { formatDateTime } from '../scripts/formatDateTime';
import _ from 'lodash';

const scale = new _LinearScale();
const drawerWidth = externalStyles.drawerWidth;
const drawerWidthNarrow = externalStyles.drawerWidthNarrow; // for small viewports (< 600px)
const timeSliderMargin = externalStyles.timeSliderMargin;

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
    transition: theme.transitions.create(['left', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    [`${theme.breakpoints.down('sm')}`]: {
      left: drawerWidthNarrow,
      width: `calc(100% - ${drawerWidthNarrow}px - ${timeSliderMargin*2}px)`,
    }, 
  },
  sliderRoot: {
    width: '90%',
    margin: 'auto'
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
    position: 'relative',
    width: '90%',
    margin: 'auto'
  }
});

function TimeSlider(props) {
  
  const handleChange = (event, value) => {
    // this is called repeatedly when sliding
    props.handleTimeChange(value);
    // console.log('***orig time slide shift***');
    // debouncedhandleChange(value)
  };

  // const debouncedhandleChange = _.debounce(value => {
  //   props.handleTimeChange(value);
  //   console.log('***time slide shift***');
  // }, 200)

  // https://stackoverflow.com/questions/23123138/perform-debounce-in-react-js
  // need debouncing ?
  const handleDragEnd = (event) => {
    let mapLayers = Object.assign({},props.mapLayers), orderedMapLayers = [...props.orderedMapLayers];
    
    // loop through orderlayers and update necessary layers depending on timeSensitive param 
    orderedMapLayers.forEach((layer)=> {
      let layerObj = mapLayers[layer];
      if (layerObj['timeSensitive'] && layerObj['isOn']) props.updateLeafletLayer({id: layer, ...layerObj});
    });
  };

  const constructTickValueArray = (startTime, endTime, timeInterval) => {
    let currentTime = startTime, tickValueArray = [startTime];

    while (currentTime <= (endTime - timeInterval)) {
      currentTime += timeInterval;
      tickValueArray.push(currentTime);
    }
    tickValueArray.push(endTime);
    return tickValueArray
  }

  const { classes, open, startTime, endTime, mapTime} = props;
  scale.domain = [startTime, endTime]

  let tickVals = constructTickValueArray(startTime, endTime, 3600000*24*3);

  return (     
    <div className={classNames(classes.sliderDiv, {
      [classes.sliderDivShift]: open,
    })}>
        <Typography style={{textAlign: 'center'}} id="label">{formatDateTime(mapTime,'YYYY-MM-DD HH:mm',' UTC')}</Typography>
        <Slider
          classes={{
            container: classes.slider, thumb: classes.sliderThumb,
            root: classes.sliderRoot,
            trackBefore:  classes.sliderTrackBefore,
            trackAfter: classes.sliderTrackAfter 
          }}
          value={mapTime}
          min={startTime}
          max={endTime}
          step={3600000}
          onChange={handleChange}
          onDragEnd={()=> console.log('drag ended.. real func is commented')}//{handleDragEnd}
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
