import React from "react";
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import { Slider, Rail, Handles, Tracks, Ticks } from 'react-compound-slider'
import { Handle } from './Handle';
import { Track } from './Track';
import SettingsTick from './SettingsTick';

// https://sghall.github.io/react-compound-slider/#/getting-started/tutorial

const sliderStyle = {  // Give the slider some width
  position: 'relative',
  width: '100%',
  height: 80,
  border: '1px solid steelblue',
}

const railStyle = { 
  position: 'absolute',
  width: '100%',
  height: 5, // 10
  marginTop: 35,
  borderRadius: 5,
  backgroundColor: 'lightgray' // '#8B9CB6',
}

const styles = theme => ({
  // img: {
  //   width: '100%',
  // },
});

/** Component used to build a dynamic legend */
const OpacitySlider = (props) => {

  return (
    <Slider
    rootStyle={sliderStyle}
    domain={[0, 100]}
    step={1}
    mode={2}
    values={[props.opacity*100]}
    onChange={(val) => props.handleLayerOpacityUpdate(props.layerID, val[0])}
  >
    <Rail>
      {({ getRailProps }) => (  // adding the rail props sets up events on the rail
        <div style={railStyle} {...getRailProps()} /> 
      )}
    </Rail>
    <Handles>
      {({ handles, getHandleProps }) => (
        <div className="slider-handles">
          {handles.map(handle => (
            <Handle
              key={handle.id}
              handle={handle}
              getHandleProps={getHandleProps}
            />
          ))}
        </div>
      )}
    </Handles>
    <Tracks right={false}>
      {({ tracks, getTrackProps }) => (
        <div className="slider-tracks">
          {tracks.map(({ id, source, target }) => (
            <Track
              key={id}
              source={source}
              target={target}
              getTrackProps={getTrackProps}
            />
          ))}
        </div>
      )}
    </Tracks>
    <Ticks values={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}>
      {({ ticks }) => (
        <div className="slider-ticks">
          {ticks.map(tick => ( // get back ids, values and percents (to place them)
            <SettingsTick key={tick.id} tick={tick} count={ticks.length} />
          ))}
        </div>
      )}
    </Ticks>
  </Slider>
  );
}

export default withStyles(styles, { withTheme: true })(OpacitySlider);
