import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import SettingsIcon from '@material-ui/icons/Settings';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  settingsCog: {
    // [`${theme.breakpoints.down('sm')}`]: { 
    //   display: 'none', 
    // }
  }
})

/** Component used to display layer settings */
const SettingsCog = (props) => {

  const handleCogClick = (layerID, e) => {
    e.stopPropagation();
    e.preventDefault();
    props.handleSettingsPanelVisibility(layerID)
  }
  
  return (
    <React.Fragment>
      <Tooltip title="Layer Settings" placement="right-start">
        <IconButton aria-label="Settings" onClick={(e) => handleCogClick(props.layerID, e)}>
          <SettingsIcon />
        </IconButton>
      </Tooltip>
    </React.Fragment>
  );
}

export default withStyles(styles, { withTheme: true })(SettingsCog);