import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import PersistentDrawerLeft from './components/PersistentDrawerLeft.js';
import layers from './scripts/layers';
import moment from 'moment';


class App extends Component {
  constructor(props) {
    super(props);

    let startTime = moment.utc().startOf('day').subtract(10, "days").valueOf();
    let endTime = moment.utc().startOf('day').add(8, "days").valueOf();
    
    this.state = {
      startTime: startTime,
      endTime: endTime,
      mapTime: moment.utc().startOf('hour').valueOf(),
      initializedLayers: false,
      mapLayers: [],
      orderedMapLayers: [],
      isLoading: null,
      error: null,
      toc: layers,
    };

    this.populateAvailableLevels = this.populateAvailableLevels.bind(this);
    this.findObjIndex = this.findObjIndex.bind(this);
    this.handleLayerToggle = this.handleLayerToggle.bind(this);
    this.handleLevelChange = this.handleLevelChange.bind(this);
    this.handleTimeChange = this.handleTimeChange.bind(this);
  }

  /**
   * Find the index of a key in an array
   * @param {array} outerArray array of objects
   * @param {str} objKey object key
   * @param {str} objValue object value
   * @returns {int} index of particular object
   */
  findObjIndex(outerArray, objKey, objValue) {
  	let objIndex = outerArray.findIndex(innerObj => innerObj[objKey] === objValue);
  	return objIndex
  }

  /**
  * Parse data and populate available levels for various metocean datasets
  * @param {obj} data metocean data availability objected fetched from s3
  */
  populateAvailableLevels(data) {
    let dataset, subResource, levels, categories = [...this.state.toc], 
      metOceanLayers = [], mapLayers = Object.assign({},this.state.mapLayers), 
      orderedMapLayers = [...this.state.orderedMapLayers];
    
    let metocDatasetMappingIndx = this.findObjIndex(categories, 'Category', 'MetOcean');
    let orderedMetOceanLayers = categories[metocDatasetMappingIndx]['Layers'].map(
      (model, indx) => ({model: model['s3Name'], index: indx}));

    for (let indx=0; indx<orderedMetOceanLayers.length; indx++) {
      dataset = orderedMetOceanLayers[indx]['model'];
      // check that dataset exists within available datasets returned from s3
      if (!Object.keys(data).includes(dataset)) {
        continue
      }

      let orderedSubresouces = categories[metocDatasetMappingIndx]['Layers'][indx]['subResources'].map(
        ((subresource, innerIndx) => ({subresource: subresource['s3Name'], index: innerIndx})));
      
      for (let innerIndx=0; innerIndx<orderedSubresouces.length; innerIndx++) {
        subResource = orderedSubresouces[innerIndx]['subresource'];
        // check that subresource exists within available data returned from s3
        if (!Object.keys(data[dataset]).includes(subResource)) {
          continue
        }

        let layerObj = categories[metocDatasetMappingIndx]['Layers'][indx]['subResources'][innerIndx];
        let categoryVisible = categories[metocDatasetMappingIndx]['visibleTOC'];
        let layerObjVisible = layerObj['visibleTOC'];

        if (categoryVisible && layerObjVisible) {
          let id = layerObj['id']
          
          levels = Object.keys(data[dataset][subResource]['level']).map(level => parseInt(level)).sort(function(a, b){return a-b});
          categories[metocDatasetMappingIndx]['Layers'][indx]['subResources'][innerIndx]['availableLevels'] = levels;

          mapLayers[id] = {isOn: layerObj['defaultOn'], level: levels[0], timeSensitive: layerObj['timeSensitive']};

          // add layer id to metOceanLayers list (this list maintains the order the layers are in)
          metOceanLayers.push(id);
        }
      }
    }

    // TODO: assign update function in layers.js for each layer... so it gets passed to Map.js
    // can store update functions in Map.js... not really category specific... like bathy and GOM lease blocks
    // require different calls to get/display data
    let metOceanInjectionIndex = this.state.orderedMapLayers.indexOf('MetOcean');
    if (metOceanInjectionIndex > -1) {
      orderedMapLayers[metocDatasetMappingIndx] = metOceanLayers
      orderedMapLayers = orderedMapLayers.flat() // flatten array
    }

    // Dont mutate data
    // / isLoading should probably be turned off after inital data pull.. keep as is for now
    this.setState({toc: categories, isLoading: false, initializedLayers: true, mapLayers: mapLayers, orderedMapLayers})
  }

  /**
   * Fired when a layer is switched on/off
   * @param {str} layerID layer ID
   * @param {event} event
   */
  handleLayerToggle(layerID, event) {
    // dont mutate state data
    let layerIndx, mapLayers = Object.assign({}, this.state.mapLayers), orderedMapLayers = [...this.state.orderedMapLayers];

    // get the index of the layer
    layerIndx = orderedMapLayers.indexOf(layerID)

    // if turning the layer on find out where it was in the list... remove it from there and add to the end of the list
    if (event.target.checked) {
      orderedMapLayers.splice(layerIndx,1);
      orderedMapLayers.push(layerID);
    }

    mapLayers[layerID]['isOn'] = event.target.checked
    this.setState({ mapLayers, orderedMapLayers})
  }

  /**
   * Fired when the level (depth) is changed for a MetOcean layer
   * @param {str} layerID layer ID
   * @param {event} event
   */
  handleLevelChange(layerID, event) {
    let mapLayers = Object.assign({},this.state.mapLayers);
    mapLayers[layerID]['level'] = parseInt(event.target.value);
    
    this.setState({mapLayers});
  }

  /**
   * Fired when the time is changed via the slider
   * @param {int} JS datetime in milliseconds
   */
  handleTimeChange(timeValue) {
    this.setState({mapTime: timeValue});
  }

  componentWillMount() {
    let categories = [...this.state.toc], mapLayers = Object.assign({},this.state.mapLayers), 
      orderedMapLayers = [...this.state.orderedMapLayers];

    categories.forEach((category, outerIndx) => {
      if (category['Category'] !== 'MetOcean' && category['visibleTOC']) {
        category['Layers'].forEach((layerObj, innerIndx) => {
          let id = layerObj['id'];
          mapLayers[id] = {isOn: layerObj['defaultOn'], timeSensitive: layerObj['timeSensitive']};
          orderedMapLayers.push(id);
        })
      } else {
        orderedMapLayers.push('MetOcean'); // this is a placeholder (injection point for active metocean layers)
      }
    })
    this.setState({mapLayers, orderedMapLayers})
  }

  componentDidMount() {
    console.log('App component mounted');
    // https://www.robinwieruch.de/react-fetching-data/
    let categories = [...this.state.toc], error = null;
    
    let metocDatasetMappingIndx = this.findObjIndex(categories, 'Category', 'MetOcean');
    let fetchDataAvailablity = categories[metocDatasetMappingIndx]['visibleTOC'];
    // abort if MetOcean category isnt visible in TOC
    if (fetchDataAvailablity) {
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
          // let error = null;
          if (!('error' in data)) {
            console.log(data);
            this.populateAvailableLevels(data)
          } else {
            error = data['error']['message']
          }
          this.setState({ error, isLoading: false })
        })
      } else {
        this.setState({ error, isLoading: false, initializedLayers: true })
      }
  }

  render() {
    console.log('App component rendered');
    return (
      <div>
        <PersistentDrawerLeft 
          handleLayerToggle = {this.handleLayerToggle}
          handleLevelChange = {this.handleLevelChange}
          handleTimeChange = {this.handleTimeChange}
          {...this.state}
        />
      </div>
    );
  }
}

export default withTheme()(App);

