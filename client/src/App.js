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
import { getData, 
        getModelField, 
        gebcoBathyEndpoint, 
        boemEnpoint } from './scripts/dataFetchingUtils';
import priorityMap from './scripts/layerPriority';
import _ from 'lodash';

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
    this.debouncedUpdateLeafletLayer = _.debounce(this.debouncedUpdateLeafletLayer.bind(this),500);
    this.buildTileLayer = this.buildTileLayer.bind(this);
    this.buildStreamlineLayer = this.buildStreamlineLayer.bind(this);
    this.buildBathyLayer = this.buildBathyLayer.bind(this);
    this.addToLeafletLayerGroup = this.addToLeafletLayerGroup.bind(this);
    this.populateAvailableLevels = this.populateAvailableLevels.bind(this);
    this.findObjIndex = this.findObjIndex.bind(this);
    this.handleLayerToggle = this.handleLayerToggle.bind(this);
    this.handleLevelChange = this.handleLevelChange.bind(this);
    this.handleTimeChange = this.handleTimeChange.bind(this);
    this.updateValidTime = this.updateValidTime.bind(this);
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

    // create map panes
    let pane;
    for (pane in priorityMap) {
      map.createPane(pane);
      map.getPane(pane).style.zIndex = priorityMap[pane];
    }
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
            validTime: '',
            timeSensitive: layerObj['timeSensitive'], 
            addDataFunc: layerObj['addDataFunc'],
            maxNativeZoom: layerObj['maxNativeZoom'],
            minNativeZoom: layerObj['minNativeZoom'],
            maxVelocity: layerObj['maxVelocity'],
            velocityScale: layerObj['velocityScale'],
            streamFlowLayer: layerObj['streamFlowLayer'],
            overlayPriority: layerObj['overlayPriority'],
            opacity: layerObj['defaultOpacity']
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
      this.removeLeafletLayer(layerID);     
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

    this.removeLeafletLayer(layerID);
    this.addLeafletLayer({id: layerID, ...mapLayers[layerID]});
    
    this.setState({mapLayers});
  }

  /**
   * Fired when the time is changed via the slider
   * @param {int} JS datetime in milliseconds
   */
  handleTimeChange(timeValue) {
    console.log('i heard handleTimeChange');
    // testing
    this.updateLeafletLayer('blah'); // don't need input arg
    // end testing

    this.setState({mapTime: timeValue});
  }

  updateValidTime(layerID,validTime) {
    console.log(' heard updateValidTime');
    let mapLayers = Object.assign({},this.state.mapLayers);
    mapLayers[layerID]['validTime'] = validTime;
    this.setState({mapLayers});
  }

  // timeslider can call this function repeatedly instead
  updateLeafletLayer(layerObj) {
    // remove old layer and add new layer
    // this.removeLeafletLayer(layerObj['id']).then(()=>{this.addLeafletLayer(layerObj)});
    this.debouncedUpdateLeafletLayer(layerObj);

    // _.debounce(this.removeLeafletLayer(layerObj['id']).then(()=> {
    //   console.log('in updateLeafletLayer')
    //   this.addLeafletLayer(layerObj)
    // }),200);
  }

  debouncedUpdateLeafletLayer(layerObj) {
    // testing
    console.log('updating leaflet layers!');
    let mapLayers = Object.assign({},this.state.mapLayers), orderedMapLayers = [...this.state.orderedMapLayers];
    
    // loop through orderlayers and update necessary layers depending on timeSensitive param 
    orderedMapLayers.forEach((layer)=> {
      let layerObj = {...mapLayers[layer],id: layer};
      
      if (layerObj['timeSensitive'] && layerObj['isOn']) {
        this.removeLeafletLayer(layerObj['id']).then(()=>{this.addLeafletLayer(layerObj)});
      };
    });
    // end testing 
  }

  // TODO: add to correct pane... also need to set the date-valid time in the TOC
  // fix issue when sliding out of range... i.e. no scalar or vector
  addLeafletLayer(layerObj) {
    let addFuncType = layerObj['addDataFunc'];
    switch(addFuncType) {
      case 'getModelField':
        let level = isNaN(layerObj['level']) ? '' : layerObj['level']
        
        getModelField(layerObj['dataset'], layerObj['subResource'], layerObj['level'], this.state.mapTime).then(
          res => {
            let data = JSON.parse(res['data']);
            // update valid time here? TODO: something is wrong when clicking on timeslider vs sliding it
            this.updateValidTime(layerObj['id'], res['valid_time'])

            // if requested date is outside of data range
            if (!res['tile_paths']) {
              // TODO: update date valid text
              return
            }

            // add tile and streamflow data
            let maxVelocity = layerObj['maxVelocity'];
            let velocityScale = layerObj['velocityScale'];
            let tileLayer = this.buildTileLayer(layerObj,res).then(tileLayer => { 
              if (this.layerBindings.hasOwnProperty(layerObj['id'])) {
                this.removeLeafletLayer(layerObj['id']).then(() => {

                  // add tile layer
                  this.addToLeafletLayerGroup(tileLayer, layerObj, false)

                  // add stream layer
                  if (layerObj['streamFlowLayer']) {
                    this.buildStreamlineLayer(data, maxVelocity, velocityScale).then(streamLayer => {
                      this.addToLeafletLayerGroup(streamLayer, layerObj, true)
                    })
                  }
                })
              } else {
                this.addToLeafletLayerGroup(tileLayer, layerObj, false)

                if (layerObj['streamFlowLayer']) {
                  this.buildStreamlineLayer(data, maxVelocity, velocityScale).then(streamLayer => {
                    this.addToLeafletLayerGroup(streamLayer, layerObj, true)
                  })
                }
              }
            })
          }
        ).catch(alert) // TODO: make a formal modal out of this
        break;
      case 'getGebcoBathy':
        let tileLayer = this.buildBathyLayer(layerObj,gebcoBathyEndpoint).then(tileLayer => { 
          if (this.layerBindings.hasOwnProperty(layerObj['id'])) {
            this.removeLeafletLayer(layerObj['id']).then(() => {
              this.addToLeafletLayerGroup(tileLayer, layerObj, false);
            })
          } else {
            this.addToLeafletLayerGroup(tileLayer, layerObj, false);
          }
        })
        break;
      case 'getLeaseAreas':
        // let tileLayer = this.buildBathyLayer(layerObj,gebcoBathyEndpoint).then(tileLayer => { 
        //   if (this.layerBindings.hasOwnProperty(layerObj['id'])) {
        //     this.removeLeafletLayer(layerObj['id']).then(() => {
        //       this.addToLeafletLayerGroup(tileLayer, layerObj, false);
        //     })
        //   } else {
        //     this.addToLeafletLayerGroup(tileLayer, layerObj, false);
        //   }
        // })
        break;
      case 'getLeaseBlocks':
        // let tileLayer = this.buildBathyLayer(layerObj,gebcoBathyEndpoint).then(tileLayer => { 
        //   if (this.layerBindings.hasOwnProperty(layerObj['id'])) {
        //     this.removeLeafletLayer(layerObj['id']).then(() => {
        //       this.addToLeafletLayerGroup(tileLayer, layerObj, false);
        //     })
        //   } else {
        //     this.addToLeafletLayerGroup(tileLayer, layerObj, false);
        //   }
        // })
        break;
      default:
        //code block
    }


    // marker2=L.marker([0,10],{pane: 'test'})

    // let rand_lat = Math.floor(Math.random() * 11); 
    // let marker = L.marker([rand_lat,0]).bindPopup(layerObj['id']);

    // marker.addTo(this.map);
    // this.leafletLayerGroup.addLayer(marker)
    // get internal Leaflet _id and assign key/val pair in layerBindings
    // let lid = this.leafletLayerGroup.getLayerId(marker);
    // this.layerBindings[layerObj['id']] = lid;
  }

  async removeLeafletLayer(layerID) {
     
    try {
      await this.leafletLayerGroup.removeLayer(this.layerBindings[layerID]);
      delete this.layerBindings[layerID]

      if (this.layerBindings.hasOwnProperty(`${layerID}_streamlines`)) {
        await this.leafletLayerGroup.removeLayer(this.layerBindings[`${layerID}_streamlines`]);
        delete this.layerBindings[`${layerID}_streamlines`]
      }

    } catch (err) {
      console.log(err);
    } 
  }

  addToLeafletLayerGroup(layerHandle, layerObj, streamline=false) {
    this.leafletLayerGroup.addLayer(layerHandle);
    let lid_layer = this.leafletLayerGroup.getLayerId(layerHandle);
    let layerKeyStr = streamline ? `${layerObj['id']}_streamlines` : layerObj['id'];
    this.layerBindings[layerKeyStr] = lid_layer;
  }

  async buildTileLayer(layerObj,res) {
    // add tile imagery data
    let tileOptions = {
      opacity: layerObj['opacity'],
      maxNativeZoom: layerObj['maxNativeZoom'],
      minNativeZoom: layerObj['minNativeZoom'],
    }

    // add pane as an option is the layer contains overlayPriority key
    tileOptions = layerObj['overlayPriority'] ? {...tileOptions, pane: layerObj['overlayPriority']} : tileOptions;

    let tilepath = res['tile_paths']['scalar'] ? 'scalar' : 'vector';
    let tileLayer = await L.tileLayer(`https://s3.us-east-2.amazonaws.com/oceanmapper-data-storage/${res['tile_paths'][tilepath]}`,
      tileOptions);

    return tileLayer;
  }

  async buildStreamlineLayer(data, maxVelocity, scale) {
    let velocityLayer = await L.velocityLayer({
      displayValues: false,
      displayOptions: {
        velocityType: 'fluid',
        displayPosition: 'bottomleft',
        displayEmptyString: 'No velocity data'
      },
      data: data,
      maxVelocity: maxVelocity, //20.0,
      velocityScale: scale// 0.01 // arbitrary default 0.005
    });
    return velocityLayer;
  }

  // TODO: see if i can make this more generic so it can be used with other layers
  // add another optional argument.. extra options
  // also ability to choose between tilelayer and wms tilelayer... thats prob a required arg
  async buildBathyLayer(layerObj, tileEndpoint) {
    // add tile imagery data
    let tileOptions = {
      opacity: layerObj['opacity']
    }

    // add pane as an option if the layer contains overlayPriority key
    tileOptions = layerObj['overlayPriority'] ? {...tileOptions, pane: layerObj['overlayPriority']} : tileOptions;
    let tileLayer = await L.tileLayer(tileEndpoint,tileOptions);

    return tileLayer;
  }

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
            addDataFunc: layerObj['addDataFunc'],
            opacity: layerObj['defaultOpacity'],
            overlayPriority: layerObj['overlayPriority']
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

