import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
// import { withTheme } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import PersistentDrawerLeft from './components/PersistentDrawerLeft';
import layers from './scripts/layers';
import moment from 'moment';
import '@ansur/leaflet-pulse-icon/dist/L.Icon.Pulse.js';
import '@ansur/leaflet-pulse-icon/dist/L.Icon.Pulse.css';
import { formatDateTime } from './scripts/formatDateTime';
import { getData, getModelField } from './scripts/dataFetchingUtils';
// import $ from 'jquery';

// leaflet gateway
const L = window.L;

// store the map configuration properties in an object,
// we could also move this to a separate file & import it if desired.
let mapConfig = {};
mapConfig.params = {
  center: [25.8,-89.6],
  zoom: 6,
  maxZoom: 14,
  minZoom: 3,
  zoomControl: false,
  attributionControl: false
};

const styles = theme => ({
  map: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0
  },
})

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
      mapLayers: null,
      orderedMapLayers: [],
      isLoading: null,
      error: null,
      toc: layers,
    };

    this._mapNode = null;
    this.inititializeMap = this.inititializeMap.bind(this);
    this.onMapClick = this.onMapClick.bind(this);
    this.addLeafletLayer = this.addLeafletLayer.bind(this);
    this.removeLeafletLayer = this.removeLeafletLayer.bind(this);
    this.updateLeafletLayer= this.updateLeafletLayer.bind(this);
    this.buildStreamlineLayer = this.buildStreamlineLayer.bind(this);
    this.populateAvailableLevels = this.populateAvailableLevels.bind(this);
    this.findObjIndex = this.findObjIndex.bind(this);
    this.handleLayerToggle = this.handleLayerToggle.bind(this);
    this.handleLevelChange = this.handleLevelChange.bind(this);
    this.handleTimeChange = this.handleTimeChange.bind(this);
  }

  inititializeMap(id) {
    // if (this.state.map) return;
    if (this.map) return;

    let map = this.map = L.map(id, mapConfig.params);
    L.esri.basemapLayer("DarkGray").addTo(map);

    // zoom control position
    L.control.zoom({
         position:'topright'
    }).addTo(map);

    // add click event listener
    map.on('click', this.onMapClick);

    // layer/leaflet layer binding
    this.layerBindings = {};

    // add an empty layer group to the map
    this.leafletLayerGroup = L.layerGroup([]);
    this.leafletLayerGroup.addTo(map);
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

          mapLayers[id] = {
            dataset,
            subResource,
            isOn: layerObj['defaultOn'], 
            level: levels[0], 
            timeSensitive: layerObj['timeSensitive'], 
            addDataFunc: layerObj['addDataFunc'],
            maxNativeZoom: layerObj['maxNativeZoom'],
            minNativeZoom: layerObj['minNativeZoom'],
            maxVelocity: layerObj['maxVelocity'],
            velocityScale: layerObj['velocityScale'],
            streamFlowLayer: layerObj['streamFlowLayer']
          };

          // add layer id to metOceanLayers list (this list maintains the order the layers are in)
          metOceanLayers.push(id);

          // add layer to map if its on by default
          if (mapLayers[id]['isOn']) this.addLeafletLayer({id,...mapLayers[id]});  
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
      this.addLeafletLayer({id: layerID, ...mapLayers[layerID], isOn: true});
    } else {
      let lid = this.layerBindings[layerID];
      this.removeLeafletLayer(lid);
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

    // get previous layer binding
    let lid = this.layerBindings[layerID];

    // remove old layer and add new layer
    this.removeLeafletLayer(lid);
    this.addLeafletLayer({id: layerID, ...mapLayers[layerID]});
    
    this.setState({mapLayers});
  }

  /**
   * Fired when the time is changed via the slider
   * @param {int} JS datetime in milliseconds
   */
  handleTimeChange(timeValue) {
    this.setState({mapTime: timeValue});
  }

  // timeslider can call this function repeatedly instead
  updateLeafletLayer(layerObj) {
    // get previous layer binding
    let lid = this.layerBindings[layerObj['id']];

    // remove old layer and add new layer
    this.removeLeafletLayer(lid);
    this.addLeafletLayer(layerObj);
  }

  addLeafletLayer(layerObj) {

    // mapLayers[id] = {
    //         dataset,
    //         subResource,
    //         isOn: layerObj['defaultOn'], 
    //         level: levels[0], 
    //         timeSensitive: layerObj['timeSensitive'], 
    //         addDataFunc: layerObj['getModelField'],
    //         streamFlowLayer: layerObj['streamFlowLayer']
    //       };
    

    // for testing
    // let level = "0";
    // let dataset = "HYCOM_DATA";
    // let subResource = "ocean_current_speed";
    // let time = "2018-12-14T08:00Z";

    
    // getModelField(dataset, subResource, level, time).then(res=> {debugger; console.log('hi')}).catch(alert)
    //getData().then(res=> {debugger; console.log('hi')}).catch(alert)
    // end testing

    
    let addFuncType = layerObj['addDataFunc'];
    switch(addFuncType) {
      case 'getModelField':
        let maxVelocity = layerObj['maxVelocity'];
        let velocityScale = layerObj['velocityScale'];
        
        getModelField(layerObj['dataset'], layerObj['subResource'], layerObj['level'], this.state.mapTime).then(
          res => {
            // parse data and add streamflows
            // TODO: this only applies for certain layers need to add that logic in
            // add in logic for scalar vs vecotr
            let data = JSON.parse(res['data']);
            let streamLayer = this.buildStreamlineLayer(data, maxVelocity, velocityScale);

            // TODO: set opacity here the max/min zoom should also be set in layers.js
            let tileOptions = {
              opacity: 1,
              maxNativeZoom: layerObj['maxNativeZoom'],
              minNativeZoom: layerObj['minNativeZoom'],
            }
            debugger
            let tileLayer = L.tileLayer(`https://s3.us-east-2.amazonaws.com/oceanmapper-data-storage/${res['tile_paths']['scalar']}`,tileOptions);
            this.leafletLayerGroup.addLayer(tileLayer);
            this.leafletLayerGroup.addLayer(streamLayer);

            // get internal Leaflet _id and assign key/val pair in layerBindings
            let lid_stream = this.leafletLayerGroup.getLayerId(streamLayer);
            this.layerBindings[`${layerObj['id']}_streamlines`] = lid_stream;

            let lid_tile = this.leafletLayerGroup.getLayerId(tileLayer);
            this.layerBindings[layerObj['id']] = lid_tile;

            // let tileLayer = L.tileLayer('https://s3.us-east-2.amazonaws.com/oceanmapper-data-storage/HYCOM_OCEAN_CURRENTS_3D/20180914_00/0m/tiles/scalar/{z}/{x}/{y}.png',options).addTo(map);
            console.log('hi');
          }).catch(alert)


        break;
      case 'getGebcoBathy':
        //code block
        break;
      default:
        //code block
    }


    // marker2=L.marker([0,10],{pane: 'test'})
    console.log('layer being added');

    // let rand_lat = Math.floor(Math.random() * 11); 
    // let marker = L.marker([rand_lat,0]).bindPopup(layerObj['id']);

    // marker.addTo(this.map);
    // this.leafletLayerGroup.addLayer(marker)
    // get internal Leaflet _id and assign key/val pair in layerBindings
    // let lid = this.leafletLayerGroup.getLayerId(marker);
    // this.layerBindings[layerObj['id']] = lid;
  }

  removeLeafletLayer(leafletLayerID) {
    this.leafletLayerGroup.removeLayer(leafletLayerID);
  }

  buildStreamlineLayer(data, maxVelocity, scale) {
    debugger
    let velocityLayer = L.velocityLayer({
      displayValues: true,
      displayOptions: {
        velocityType: 'ocean current',
        displayPosition: 'bottomleft',
        displayEmptyString: 'No ocean current data'
      },
      data: data,
      maxVelocity: maxVelocity, //20.0,
      velocityScale: scale// 0.01 // arbitrary default 0.005
    });
    return velocityLayer;
  }

  //map.addLayer(velocityLayer)

  onMapClick(e) {
    let popupContent = `<h4>${e.latlng.toString()}</h4>`;
    let pulsingIcon = L.icon.pulse({iconSize:[10,10],color:this.props.theme.palette.secondary.main});
    let marker = L.marker(e.latlng,{icon: pulsingIcon}).bindPopup(popupContent);
    marker.on('popupclose',() => marker.removeFrom(this.map));
    marker.addTo(this.map);
    marker.openPopup();
  }

  componentWillMount() {
    let categories = [...this.state.toc], mapLayers = Object.assign({},this.state.mapLayers), 
      orderedMapLayers = [...this.state.orderedMapLayers];

    categories.forEach((category, outerIndx) => {
      if (category['Category'] !== 'MetOcean' && category['visibleTOC']) {
        category['Layers'].forEach((layerObj, innerIndx) => {
          let id = layerObj['id'];
          mapLayers[id] = {
            isOn: layerObj['defaultOn'], 
            timeSensitive: layerObj['timeSensitive'],
            addDataFunc: layerObj['addDataFunc']
          };
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
    let categories = [...this.state.toc], error = null;

    if (!this.map) {
      // create the Leaflet map object
      this.inititializeMap(this._mapNode); 
    }
    
    let metocDatasetMappingIndx = this.findObjIndex(categories, 'Category', 'MetOcean');
    let fetchDataAvailablity = categories[metocDatasetMappingIndx]['visibleTOC'];
    // https://www.robinwieruch.de/react-fetching-data/
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
      // add non metoc layers to map 
      this.state.orderedMapLayers.forEach(nonMetocLayer => {
          if (nonMetocLayer !== 'MetOcean') {
            if (this.state.mapLayers[nonMetocLayer]['isOn']) this.addLeafletLayer({id: nonMetocLayer,...this.state.mapLayers[nonMetocLayer]})
          }
        }
      )
  }

  render() {
    const { classes } = this.props;

    console.log('App component rendered');
    return (
      <div>
        <PersistentDrawerLeft 
          handleLayerToggle = {this.handleLayerToggle}
          handleLevelChange = {this.handleLevelChange}
          handleTimeChange = {this.handleTimeChange}
          updateLeafletLayer = {this.updateLeafletLayer}
          {...this.state}
        />
        <div ref={(node) => this._mapNode = node} id="map" className={classNames(classes.map)} />
      </div>
    );
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};


// export default withTheme()(App);
export default withStyles(styles, { withTheme: true })(App);

