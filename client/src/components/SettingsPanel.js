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
import { isMobile } from 'react-device-detect';

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
    [`${theme.breakpoints.down('sm')}`]: {
      position: 'absolute',
      right: 0,
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

/** Component used to display layer settings */
const SettingsPanel = (props) => {

  const { classes, activeSettingsLayer } = props;

  if (activeSettingsLayer) {
    return (
      <Draggable disabled={isMobile ? true : false}>
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
            {activeSettingsLayer['niceName']}
          </Typography>
          <Divider style={{ margin: 5 }}/>
          {activeSettingsLayer['settingsTools'].indexOf('opacity') > -1 &&
            <React.Fragment>
              <Typography variant="body1">Opacity</Typography>
              <OpacitySlider 
                layerID={activeSettingsLayer['id']}
                opacity={activeSettingsLayer['rasterProps']['opacity']}
                handleLayerSettingsUpdate={props.handleLayerSettingsUpdate}
              />
            </React.Fragment>
          }
          {activeSettingsLayer['settingsTools'].indexOf('datarange') > -1 &&
            <React.Fragment>
              <Typography variant="body1">Data Range</Typography>
              <DataRangeSlider 
                layerID={activeSettingsLayer['id']}
                absoluteMin={activeSettingsLayer['rasterProps']['absoluteMin']}
                absoluteMax={activeSettingsLayer['rasterProps']['absoluteMax']}
                currentMin={activeSettingsLayer['rasterProps']['currentMin']}
                currentMax={activeSettingsLayer['rasterProps']['currentMax']}
                interval={activeSettingsLayer['rasterProps']['interval']}
                handleLayerSettingsUpdate={props.handleLayerSettingsUpdate}
              />
            </React.Fragment>
          }
          {activeSettingsLayer['settingsTools'].indexOf('interval') > -1 &&
            <React.Fragment>
              <Typography variant="body1">Data Interval</Typography>
              <IntervalDropdown 
                layerID={activeSettingsLayer['id']}
                interval={activeSettingsLayer['rasterProps']['interval']}
                intervalArr={activeSettingsLayer['rasterProps']['dataRangeIntervals']}
                handleLayerSettingsUpdate={props.handleLayerSettingsUpdate}
              />
            </React.Fragment>
          }
          {activeSettingsLayer['settingsTools'].indexOf('colormap') > -1 &&
            <React.Fragment>
              <Typography variant="body1">Colormap</Typography>
              <ColorMapDropdown
                layerID={activeSettingsLayer['id']}
                colormap={activeSettingsLayer['rasterProps']['colormap']}
                colorramps = {activeSettingsLayer['rasterProps']['colorramps']}
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