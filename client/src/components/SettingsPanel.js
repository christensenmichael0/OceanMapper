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
import OpacitySlider from './OpacitySlider';
import DataRangeSlider from './DataRangeSlider';
import ColorMapDropdown from './ColorMapDropdown';
import externalStyles from '../scripts/styleVariables';

const drawerZIndex = externalStyles.drawerZIndex;
const drawerWidth = externalStyles.drawerWidth;
const drawerWidthNarrow = externalStyles.drawerWidthNarrow; // for small viewports (< 600px)
const settingsPanelWidth = externalStyles.settingsPanelWidth;

// https://sghall.github.io/react-compound-slider/#/getting-started/tutorial

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
  },
  settingTitle: {
    fontFamily: 'Roboto, arial',
    fontSize: '1em',
    'margin': 0
  }
});

// TODO: build the contents dynamically based on a settings tools array in the layers

/** Component used to display layer settings */
const SettingsPanel = (props) => {

  const { classes, settingsPanelOpen } = props;

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
          <Divider style={{ margin: 5 }}/>
          <p className={props.classes.settingTitle}>Opacity</p>
          <OpacitySlider 
            layerID={props.activeSettingsLayer}
            opacity={props.mapLayers[props.activeSettingsLayer]['rasterProps']['opacity']}
            handleLayerSettingsUpdate={props.handleLayerSettingsUpdate}
          />
          <p className={props.classes.settingTitle}>Data Range</p>
          <DataRangeSlider 
            layerID={props.activeSettingsLayer}
            absoluteMin={props.mapLayers[props.activeSettingsLayer]['rasterProps']['absoluteMin']}
            absoluteMax={props.mapLayers[props.activeSettingsLayer]['rasterProps']['absoluteMax']}
            currentMin={props.mapLayers[props.activeSettingsLayer]['rasterProps']['currentMin']}
            currentMax={props.mapLayers[props.activeSettingsLayer]['rasterProps']['currentMax']}
            interval={props.mapLayers[props.activeSettingsLayer]['rasterProps']['interval']}
            handleLayerSettingsUpdate={props.handleLayerSettingsUpdate}
          />
          <p className={props.classes.settingTitle}>Colormap</p>
          <ColorMapDropdown 
            colormap={props.mapLayers[props.activeSettingsLayer]['rasterProps']['colormap']}
            colorramps = {props.mapLayers[props.activeSettingsLayer]['rasterProps']['colorramps']}
            handleLayerSettingsUpdate={props.handleLayerSettingsUpdate}
          />
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