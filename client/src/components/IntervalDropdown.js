import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

const styles = theme => ({
  selectMenu: {
    margin: theme.spacing.unit,
    maxWidth: '100%'
  },
  selectItem: {
    fontSize: '0.9rem'
  }
});

const IntervalDropdown = (props) => {

  const { classes } = props;

  return (
    <div>
      <Select
        disableUnderline
        value={props.interval}
        autoWidth={false}
        onChange={(e) => props.handleLayerSettingsUpdate(props.layerID, 'interval', e.target.value)}
        name="interval"
        className={classes.selectMenu}
        classes={{
          select: classes.selectItem
        }}
      >
        {props.intervalArr.map((intervalVal, indx) => 
          <MenuItem 
            key={indx.toString()}
            value={intervalVal}
          >
            {intervalVal}
          </MenuItem>
        )}
      </Select>
    </div>
  )
}

IntervalDropdown.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(IntervalDropdown);