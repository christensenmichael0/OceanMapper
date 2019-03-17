import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { colorPaletteMapping } from '../scripts/layers.js';

const styles = theme => ({
  selectMenu: {
    margin: theme.spacing.unit,
    maxWidth: '100%'
  }
});

/** Component used to build settings panel colormap selector */
const ColormapDropdown = (props) => {

  const { classes } = props;

  return (
    <div>
        <Select
          disableUnderline
          value={props.colormap}
          autoWidth={false}
          onChange={(e) => props.handleLayerSettingsUpdate(props.layerID, 'colormap', e.target.value)}
          name="colormaps"
          className={classes.selectMenu}
        >
          {colorPaletteMapping.map((colormapObj, indx) => {
            if (props.colorramps.indexOf(Object.keys(colormapObj)[0]) > -1) {
              return (
                <MenuItem 
                  key={indx.toString()}
                  value={Object.keys(colormapObj)[0]}
                  title={Object.keys(colormapObj)[0]}
                >
                  <img src={colormapObj[Object.keys(colormapObj)[0]]} alt='colorramp'/>
                </MenuItem>
              )
            } else {
              return null
            }
          })}
        </Select>
      </div>
  )
}

ColormapDropdown.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ColormapDropdown);