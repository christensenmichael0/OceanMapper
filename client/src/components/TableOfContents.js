import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListSubheader from '@material-ui/core/ListSubheader';
import Divider from '@material-ui/core/Divider';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import TOCskeleton from '../scripts/layers';
import SimpleExpansionPanel from './TestExpansion';

let datasetMapping = {
  HYCOM_DATA: {
    niceName: 'HYCOM CURRENTS',
    subResources: {
      ocean_current_speed: {niceName: 'HYCOM Currents', availableLevels: []}
    }
  },
  RTOFS_DATA: {
    niceName: 'RTOFS CURRENTS',
    subResources: {
      ocean_current_speed: {niceName: 'RTOFS Currents', availableLevels: []}
    }
  },
  GFS_DATA: {
    niceName: 'GFS WINDS',
    subResources: {
      wind_speed: {niceName: 'GFS Winds', availableLevels: []}
    }
  },
  WW3_DATA: {
    niceName: 'WAVEWATCH3',
    subResources: {
      sig_wave_height: {niceName: ' WW3 Signficant Wave Height', availableLevels: []},
      primary_wave_dir: {niceName: 'WW3 Primary Wave Direction', availableLevels: []},
      primary_wave_period: {niceName: 'WW3 Primary Wave Period', availableLevels: []}
    }
  }
}

// https://stackoverflow.com/questions/35905988/react-js-how-to-append-a-component-on-click

const styles = theme => ({});

class TableOfContents extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: null,
      error: null,
    };

    this.populateAvailableLevels = this.populateAvailableLevels.bind(this);

    // this.updateMap = this.updateMap.bind(this);
    // need to pass some onclick function to the child as well as the state of the child (on/off)
    // to determine what to render

    // keep track of whats on and whats off (are somethings on by default? - yes)
    // look to some kind of config file to see which layers are on by default
    // isLoading state can be use to conditionally render... i.e. if done loading then build the TOC

  }

  populateAvailableLevels(data) {
    let dataset, subResource, levels;
    for (dataset in data) {
      if (!(dataset in datasetMapping)) {
        continue
      }
      for (subResource in data[dataset]) {
        levels = Object.keys(data[dataset][subResource]['level']).map(level => parseInt(level)).sort(function(a, b){return a-b});
        datasetMapping[dataset]['subResources'][subResource]['availableLevels'] = levels;
      }
    }
    
    this.data_availability = Object.assign({}, datasetMapping);
  }

  componentDidMount() {
    // https://www.robinwieruch.de/react-fetching-data/
    this.setState({ isLoading: true });

    fetch('/download/data_availability.json')
      .then(response => {
        if (response.ok) {
          return response.json();
        } 
        throw new Error('Request failed!');
      }, networkError => {
        this.setState({ error: networkError, isLoading: false });
      })
      .then(data => {
        let error = null;
        if (!('error' in data)) {
          console.log(data);
          this.populateAvailableLevels(data)
        } else {
          error = data['error']['message']
        }
        this.setState({ error, isLoading: false })
      })
      // .catch(error => this.setState({ error, isLoading: false }));

    // fetch('/download/data_availability.json')
    //   .then(response => {
    //     if (response.ok) {
    //       return response.json();
    //     } else {
    //       throw new Error('Something went wrong ...');
    //     }
    //   })
    //   .then(data => {
    //     this.data_availability = data;
    //     this.setState({ isLoading: false })
        
    //     // TODO: loop through the data
    //   })
    //   .catch(error => this.setState({ error, isLoading: false }));
  }

  render() {

    return (
      <div>
      <SimpleExpansionPanel />
        {/*<List
          component="nav"
          subheader={<ListSubheader component="div">Nested List Items</ListSubheader>}
        >
          {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          {['All mail', 'Trash', 'Spam'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
      */}
      </div>
    )
  }
}

// export default TableOfContents;
TableOfContents.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(TableOfContents);
