import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import ExpansionPanel from './ExpansionPanel';
import ExpansionPanelSummary from './ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';

// https://github.com/mui-org/material-ui/pull/10961
// https://stackoverflow.com/questions/46066675/how-to-add-multiple-classes-in-material-ui-using-the-classes-props

const styles = theme => ({
  root: {
    width: '100%',
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightMedium,
  },
  expansionDetailRoot: {
    display: 'block',
    paddingTop: 0
  }
});

function TOCExpansionPanel(props) {
  const { classes, theme, defaultExpanded } = props;
  return (
    <div className={classes.root}>
      <ExpansionPanel
        defaultExpanded={defaultExpanded}
      >
        <ExpansionPanelSummary
          expandIcon={<AddIcon />}
          collapseIcon={<RemoveIcon />}
        >
          <Typography className={classes.heading}>{props.categoryName}</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails
          classes={{
            root: classes.expansionDetailRoot
          }}
        >
          {props.children}
        </ExpansionPanelDetails>
      </ExpansionPanel>
    </div>
  );
}

TOCExpansionPanel.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(TOCExpansionPanel);