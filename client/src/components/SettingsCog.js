import React from 'react';
// import PropTypes from 'prop-types';
// import classNames from 'classnames';
import Tooltip from '@material-ui/core/Tooltip';
// import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import IconButton from '@material-ui/core/IconButton';
import SettingsIcon from '@material-ui/icons/Settings';
import { withStyles } from '@material-ui/core/styles';


const styles = theme => ({})

/** Component used to display layer settings */
const SettingsCog = (props) => {
  
  return (
    <React.Fragment>
      <Tooltip title="Layer Settings" placement="right-start">
        <IconButton aria-label="Settings" onClick={props.handleSettingsPanelVisibility.bind(this, props.layerID)}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>
    </React.Fragment>
  );
}

export default withStyles(styles, { withTheme: true })(SettingsCog);