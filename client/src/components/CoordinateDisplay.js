import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import externalStyles from '../scripts/styleVariables';

const coordinateMargin = externalStyles.timeSliderMargin;
const coordinateOpacity = externalStyles.timeSliderOpacity;

const styles = theme => ({
  coordinates: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    padding: 5,
    margin: coordinateMargin,
    opacity: coordinateOpacity,
    fontSize: 12,
    zIndex: 500,
    fontFamily: "Roboto, Helvetica, Arial, sans-serif",
    borderRadius: 2,
    backgroundColor: theme.palette.primary.main
  },
  coordinatesHide: {
    [`${theme.breakpoints.down('md')}`]: { 
      display: 'none', 
    }
  },
});

/** Component used to display cursor coordinates */
const CoordinateDisplay = (props) => {

  const formatCoords = (lat, lng) => {
    return (
      <span>Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}</span>
    )
  }

  const { classes, lat, lng } = props;
  return (
    <React.Fragment>
      {(lat && lng) && 
        <div className={classNames(classes.coordinates, classes.coordinatesHide)}>
          <span>{formatCoords(lat, lng)}</span>
        </div>
      }
    </React.Fragment>
  );
}

CoordinateDisplay.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(CoordinateDisplay);