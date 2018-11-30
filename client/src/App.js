import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import PersistentDrawerLeft from './components/PersistentDrawerLeft.js';
import layers from './scripts/layers';
import moment from 'moment';


// import './App.css';
// import Map from './Map';

class App extends Component {
  constructor(props) {
    super(props);

    let startTime = moment.utc().startOf('day').subtract(10, "days").valueOf();
    let endTime = moment.utc().startOf('day').add(8, "days").valueOf();
    
    this.state = {
      startTime: startTime,
      endTime: endTime,
      mapTime: moment.utc().startOf('hour').valueOf(),
      isLoading: null,
      error: null,
      toc: layers,
    };

    this.populateAvailableLevels = this.populateAvailableLevels.bind(this);
    this.findObjIndex = this.findObjIndex.bind(this);
    this.handleLayerToggle = this.handleLayerToggle.bind(this);
    this.handleTimeChange = this.handleTimeChange.bind(this);
  }

  // TODO: move this into some kind of utilities file and import
  findObjIndex(outerArray, objKey, objValue) {
  	let objIndex = outerArray.findIndex(innerObj => innerObj[objKey] === objValue);
  	return objIndex
  }

  populateAvailableLevels(data) {
    let dataset, subResource, levels, layers = {}, categories = [...this.state.toc];
    
    let metocDatasetMappingIndx = this.findObjIndex(categories, 'Category', 'MetOcean');
    for (dataset in data) {
      let datasetIndx = this.findObjIndex(categories[metocDatasetMappingIndx]['Layers'], 's3Name', dataset);
      if (datasetIndx === -1) {
      	continue
      }

      for (subResource in data[dataset]) {
      	let subResourceIndx = this.findObjIndex(categories[metocDatasetMappingIndx]['Layers'][datasetIndx]['subResources'],
      		's3Name',subResource);
        let layerObj = categories[metocDatasetMappingIndx]['Layers'][datasetIndx]['subResources'][subResourceIndx];
        let categoryVisible = categories[metocDatasetMappingIndx]['visibleTOC'];
        let layerObjVisible = layerObj['visibleTOC'];
        
        if (categoryVisible && layerObjVisible) {
          let id = layerObj['id']
          
          levels = Object.keys(data[dataset][subResource]['level']).map(level => parseInt(level)).sort(function(a, b){return a-b});
          categories[metocDatasetMappingIndx]['Layers'][datasetIndx]['subResources'][subResourceIndx]['availableLevels'] = levels;

          // layers[`isOn_${id}`] = layerObj['defaultOn'];
          // layers[id] = layerObj['defaultOn'];
          // debugger
          layers[id] = {isOn: layerObj['defaultOn'], level: levels[0]};
          // TODO add the minimum level as default
        }
      }
    }
    // Dont mutate data
    // / isLoading should probably be turned off after inital data pull.. keep as is for now
    this.setState({toc: categories, isLoading: false, ...layers})
  }

  handleLayerToggle(layerID, event) {
    // create a copy of the entire layer attribute object so not mutating data
    const layerAttr = Object.assign({}, this.state[layerID], {isOn: event.target.checked})
    this.setState({ [layerID]: layerAttr});
  }

  handleTimeChange(timeValue) {
    this.setState({mapTime: timeValue});
  }

  componentWillMount() {
    let layers = {}, categories = [...this.state.toc];

    categories.map((category, outerIndx) => {
      if (category['Category'] !== 'MetOcean' && category['visibleTOC']) {
        category['Layers'].map((layerObj, innerIndx) => {
          let id = layerObj['id'];
          layers[id] = {isOn: layerObj['defaultOn']};
        })
      }
    })
    this.setState({...layers});
  }

  componentDidMount() {
    console.log('App component mounted');
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
  }

  render() {
    console.log('App component rendered');
    // TODO: what needs to be passed to persistentdrawer?
    // data for TOC
    // functions describing what to do on certain events
    // state of various layers (whats on/off)
    // the map time
    return (
      <div >
        <PersistentDrawerLeft 
          handleLayerToggle = {this.handleLayerToggle} 
          handleTimeChange = {this.handleTimeChange}
          {...this.state}
        />
      </div>
    );
  }
}

export default withTheme()(App);

