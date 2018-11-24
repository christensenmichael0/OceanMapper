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
import Map from './Map';
import Slider from '@material-ui/lab/Slider';
import Typography from '@material-ui/core/Typography';

const drawerWidth = 340;
const drawerWidthNarrow = 280; // for small viewports (< 600px)

const styles = theme => ({
  root: {
    display: 'flex',
  },
  appBar: {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    'background': 'transparent',
    'boxShadow': 'none',
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    [`${theme.breakpoints.down('xs')}`]: { 
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
    [`${theme.breakpoints.down('xs')}`]: { 
      width: drawerWidthNarrow, 
    }, 
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth, 
    [`${theme.breakpoints.down('xs')}`]: { 
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
  },
  sliderDiv: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    // width: `calc(100% - 20px)`,
    width: '400px',
    margin: 10,
    zIndex: 500,
    overflow: 'hidden',
    borderRadius: '2px',
    backgroundColor: theme.palette.primary.main,
    transition: theme.transitions.create(['left', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  sliderDivShift: {
    left: drawerWidth,
    // width: `calc(100% - ${drawerWidth}px - 20px)`,
    transition: theme.transitions.create(['left', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  sliderRoot: {
    padding: '0 20px',
  },
  slider: {
    padding: '22px 10px',
    backgroundColor: theme.palette.primary.main
  },
  sliderTrackBefore: {
    backgroundColor: theme.palette.secondary.main
  },
  sliderTrackAfter: {
    backgroundColor: 'black'
  },
  sliderThumb: {
    backgroundColor: theme.palette.secondary.main,
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
    const { classes, theme } = this.props;
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
          <TableOfContents {...this.props}/>
        </Drawer>
        <main className={classes.content}>
          <Map />
          <div className={classNames(classes.sliderDiv, {
            [classes.sliderDivShift]: open,
          })}>
            <Typography id="label">Slider label</Typography>
            <Slider
              classes={{
                container: classes.slider, thumb: classes.sliderThumb,
                root: classes.sliderRoot,
                trackBefore:  classes.sliderTrackBefore,
                trackAfter: classes.sliderTrackAfter 
              }}
              value={3}
              min={0}
              max={6}
              step={1}
              onChange={function(){console.log('slider changed!')}}
            />
            </div>
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
