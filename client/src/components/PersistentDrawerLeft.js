import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TableOfContents from './TableOfContents';
// import Map from './Map';
import TimeSlidler from './TimeSlider';
import externalStyles from '../scripts/styleVariables';

const drawerWidth = externalStyles.drawerWidth;
const drawerWidthNarrow = externalStyles.drawerWidthNarrow; // for small viewports (< 600px)

const styles = theme => ({
  root: {
    display: 'flex',
  },
  appBar: {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    'zIndex': 999,
    'background': 'transparent',
    'boxShadow': 'none',
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    [`${theme.breakpoints.down('sm')}`]: { 
      width: `calc(100% - ${drawerWidthNarrow}px)`,
      marginLeft: drawerWidthNarrow, 
    }, 
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 20,
    backgroundColor: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.secondary.main,
    },
  },
  hide: {
    display: 'none',
  },
  drawer: {
    width: drawerWidth,
    [`${theme.breakpoints.down('sm')}`]: { 
      width: drawerWidthNarrow, 
    }, 
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth, 
    [`${theme.breakpoints.down('sm')}`]: { 
      width: drawerWidthNarrow, 
    }
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
  },
  content: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  }
});

class PersistentDrawerLeft extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      open: false,
    };

    this.handleDrawerOpen = this.handleDrawerOpen.bind(this);
    this.handleDrawerClose = this.handleDrawerClose.bind(this);
  }

  handleDrawerOpen() {
    this.setState({ open: true });
  };

  handleDrawerClose() {
    this.setState({ open: false });
  };

  componentDidMount() {
    console.log('drawer component mounted');
  }

  render() {
    console.log('drawer rendered')
    const { classes, theme, ...other } = this.props;
    const { open } = this.state;

    return (
      <div className={classes.root}>
        <CssBaseline />
        <AppBar
          position="fixed"
          className={classNames(classes.appBar, {
            [classes.appBarShift]: open,
          })}
        >
          <Toolbar disableGutters={!open}>
            <IconButton
              aria-label="Open drawer"
              onClick={this.handleDrawerOpen}
              className={classNames(classes.menuButton, open && classes.hide)}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Drawer
          className={classes.drawer}
          variant="persistent"
          anchor="left"
          open={open}
          classes={{
            paper: classes.drawerPaper,
          }}
        >
          <div className={classes.drawerHeader}>
            <IconButton onClick={this.handleDrawerClose}>
              {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          </div>
          <Divider />
          <TableOfContents {...other}/>
        </Drawer>
        <main className={classes.content}>
          {/* <Map {...other}/> */}
          <TimeSlidler open={open} {...other}/>
        </main>
      </div>
    );
  }
}
// a ? blah : nah

// classes={{ root: open ?  `${classes.test} ${classes.sliderRootShrink}` : `${classes.test} ${classes.sliderRoot}`, 
// className={classes.sliderRoot}
// root: open ?  classes.sliderRootShrink : classes.sliderRoot

PersistentDrawerLeft.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(PersistentDrawerLeft);
