import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Draggable from 'react-draggable';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import CancelIcon from '@material-ui/icons/Cancel';
import Divider from '@material-ui/core/Divider';
import { withStyles } from '@material-ui/core/styles';
import OpacitySlider from './OpacitySlider';
import DataRangeSlider from './DataRangeSlider';
import ColorMapDropdown from './ColorMapDropdown';
import IntervalDropdown from './IntervalDropdown';
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
    zIndex: drawerZIndex+1,
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit * 2,
    width: settingsPanelWidth,
    marginLeft: drawerWidth + 5,
    overflow: 'auto',
    [`${theme.breakpoints.down('sm')}`]: { 
      width: settingsPanelWidth,
      marginLeft: drawerWidthNarrow  + 5, 
    },
    [`${theme.breakpoints.down('xs')}`]: {
      position: 'absolute',
      margin: 'auto',
      left: 0,
      top: 0,
      maxWidth: '95vw',
      maxHeight: '95vh'
    },
  },
  closeButton: {
    position: 'absolute',
    top: 1,
    right: 1,
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
          {props.mapLayers[props.activeSettingsLayer]['settingsTools'].indexOf('opacity') > -1 &&
            <React.Fragment>
              <Typography variant="body1">Opacity</Typography>
              <OpacitySlider 
                layerID={props.activeSettingsLayer}
                opacity={props.mapLayers[props.activeSettingsLayer]['rasterProps']['opacity']}
                handleLayerSettingsUpdate={props.handleLayerSettingsUpdate}
              />
            </React.Fragment>
          }
          {props.mapLayers[props.activeSettingsLayer]['settingsTools'].indexOf('datarange') > -1 &&
            <React.Fragment>
              <Typography variant="body1">Data Range</Typography>
              <DataRangeSlider 
                layerID={props.activeSettingsLayer}
                absoluteMin={props.mapLayers[props.activeSettingsLayer]['rasterProps']['absoluteMin']}
                absoluteMax={props.mapLayers[props.activeSettingsLayer]['rasterProps']['absoluteMax']}
                currentMin={props.mapLayers[props.activeSettingsLayer]['rasterProps']['currentMin']}
                currentMax={props.mapLayers[props.activeSettingsLayer]['rasterProps']['currentMax']}
                interval={props.mapLayers[props.activeSettingsLayer]['rasterProps']['interval']}
                handleLayerSettingsUpdate={props.handleLayerSettingsUpdate}
              />
            </React.Fragment>
          }
          {props.mapLayers[props.activeSettingsLayer]['settingsTools'].indexOf('interval') > -1 &&
            <React.Fragment>
              <Typography variant="body1">Data Interval</Typography>
              <IntervalDropdown 
                layerID={props.activeSettingsLayer}
                interval={props.mapLayers[props.activeSettingsLayer]['rasterProps']['interval']}
                intervalArr={props.mapLayers[props.activeSettingsLayer]['rasterProps']['dataRangeIntervals']}
                handleLayerSettingsUpdate={props.handleLayerSettingsUpdate}
              />
            </React.Fragment>
          }
          {props.mapLayers[props.activeSettingsLayer]['settingsTools'].indexOf('colormap') > -1 &&
            <React.Fragment>
              <Typography variant="body1">Colormap</Typography>
              <ColorMapDropdown
                layerID={props.activeSettingsLayer}
                colormap={props.mapLayers[props.activeSettingsLayer]['rasterProps']['colormap']}
                colorramps = {props.mapLayers[props.activeSettingsLayer]['rasterProps']['colorramps']}
                handleLayerSettingsUpdate={props.handleLayerSettingsUpdate}
              />
            </React.Fragment>
          }
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