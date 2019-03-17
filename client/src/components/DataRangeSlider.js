import React from "react";
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import { Slider, Rail, Handles, Tracks, Ticks } from 'react-compound-slider'
import Handle from './Handle';
import Track from './Track';
import SettingsTick from './SettingsTick';

// https://sghall.github.io/react-compound-slider/#/getting-started/tutorial

const styles = theme => ({
  sliderStyle: {  // Give the slider some width
    position: 'relative',
    width: '100%',
    height: 60
  },
  railStyle: { 
    position: 'absolute',
    width: '100%',
    height: 2,
    marginTop: 25,
    borderRadius: 5,
    backgroundColor: 'lightgray'
  }
});

/** Component used to build a dynamic legend */
const DataRangeSlider = (props) => {

  return (
    <Slider
      className={props.classes.sliderStyle}
      domain={[props.absoluteMin, props.absoluteMax]}
      step={props.interval}
      mode={2}
      values={[props.currentMin, props.currentMax]}
      onChange={(vals) => props.handleLayerSettingsUpdate(props.layerID, 'data-range', vals)}
    >
    <Rail>
      {({ getRailProps }) => (
        <div className={props.classes.railStyle} {...getRailProps()} /> 
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
    <Tracks left={false} right={false}>
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
    <Ticks count={15}> 
      {({ ticks }) => (
        <div className="slider-ticks">
          {ticks.map(tick => (
            <SettingsTick key={tick.id} tick={tick} count={ticks.length} />
          ))}
        </div>
      )}
    </Ticks>
  </Slider>
  );
}

export default withStyles(styles, { withTheme: true })(DataRangeSlider);
