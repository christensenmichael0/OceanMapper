import React from 'react';
import PropTypes from 'prop-types';
// import classNames from 'classnames';
import Paper from '@material-ui/core/Paper';
import Draggable from 'react-draggable';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import CancelIcon from '@material-ui/icons/Cancel';
import Divider from '@material-ui/core/Divider';
import { withStyles } from '@material-ui/core/styles';
import externalStyles from '../scripts/styleVariables';

const drawerZIndex = externalStyles.drawerZIndex;
const drawerWidth = externalStyles.drawerWidth;
const drawerWidthNarrow = externalStyles.drawerWidthNarrow; // for small viewports (< 600px)
const settingsPanelWidth = externalStyles.settingsPanelWidth;

// TODO only open when clicking on settings cog
// add close button
// if small viewport then make full screen
// set max width/min width
// make it draggable

const styles = theme => ({
  root: {
    ...theme.mixins.gutters(),
    position: 'absolute',
    top: 100,
    zIndex: drawerZIndex,
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    width: settingsPanelWidth,
    marginLeft: drawerWidth + 5,
    [`${theme.breakpoints.down('sm')}`]: { 
      width: settingsPanelWidth,
      marginLeft: drawerWidthNarrow  + 5, 
    }, 
  },
  closeButton: {
    position: 'absolute',
    top: 1,
    right: 1,
  }
});

/** Component used to display layer settings */
const SettingsPanel = (props) => {

  const { classes, settingsPanelOpen } = props;

  // TODO: use cancelIcon for close button (iconButton)
  // const settingsPanel = component or null depending on state of settingsPanelOpen
  // <Button className={classes.closeButton}>&times;</Button>
  if (settingsPanelOpen) {
    return (
      <Draggable>
        <Paper className={classes.root} elevation={2}>
          <IconButton className={classes.closeButton} aria-label="Close" color="primary">
            <CancelIcon onClick={props.handleSettingsPanelHide}/>
          </IconButton>
          <Typography
            variant="title" 
            component="h6" 
            noWrap={true} 
            align={'center'} 
            gutterBottom={true}
          >
            {props.mapLayers[props.activeSettingsLayer]['niceName']}
          </Typography>
          <Divider />
          <Typography component="p">
            Paper can be used to build surface or other elements for your application.
          </Typography>
        </Paper>
      </Draggable>
    )
  } else {
    return null
  }
}

SettingsPanel.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(SettingsPanel);