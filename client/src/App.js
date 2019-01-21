import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
// import { withTheme } from '@material-ui/core/styles';
import './App.css';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import PersistentDrawerLeft from './components/PersistentDrawerLeft';
import layers from './scripts/layers';
import moment from 'moment';
import '@ansur/leaflet-pulse-icon/dist/L.Icon.Pulse.js';
import '@ansur/leaflet-pulse-icon/dist/L.Icon.Pulse.css';
import { getData,
        getPointData,
        getModelField
        } from './scripts/dataFetchingUtils';
import { populateImageUrlEndpoint } from './scripts/formattingUtils';
import { addCustomLeafletHandlers } from './scripts/addCustomLeafletHandlers';
import { buildActiveDrillingPopupStationContent,
         buildActiveDrillingPopupButtons } from './scripts/buildActiveDrillingPopup';
import priorityMap from './scripts/layerPriority';
import _ from 'lodash';

const L = addCustomLeafletHandlers();

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
      isLoadingMetoc: false,
      metocLoadError: false,
      toc: layers,
      deepwater_activity: null,
      chartModalOpen: false
    };

    this._mapNode = React.createRef();
    this.inititializeMap = this.inititializeMap.bind(this);
    this.getMapDimensionInfo = this.getMapDimensionInfo.bind(this);
    this.onMapClick = this.onMapClick.bind(this);
    this.onMapBoundsChange = this.onMapBoundsChange.bind(this);
    this.checkLayerStatus = this.checkLayerStatus.bind(this);
    this.addLeafletLayer = this.addLeafletLayer.bind(this);
    this.removeLeafletLayer = this.removeLeafletLayer.bind(this);
    this.addLayer = this.addLayer.bind(this);
    this.debouncedUpdateLeafletLayer = _.debounce(this.debouncedUpdateLeafletLayer.bind(this),500);
    this.buildMetocTileLayer = this.buildMetocTileLayer.bind(this);
    this.buildStreamlineLayer = this.buildStreamlineLayer.bind(this);
    this.buildImageLayer = this.buildImageLayer.bind(this);
    this.buildGeneralTileLayer = this.buildGeneralTileLayer.bind(this);
    this.buildActiveDrillingLayer = this.buildActiveDrillingLayer.bind(this);
    this.addToLeafletLayerGroup = this.addToLeafletLayerGroup.bind(this);
    this.populateAvailableLevels = this.populateAvailableLevels.bind(this);
    this.findObjIndex = this.findObjIndex.bind(this);
    this.handleLayerToggle = this.handleLayerToggle.bind(this);
    this.handleLevelChange = this.handleLevelChange.bind(this);
    this.handleTimeChange = this.handleTimeChange.bind(this);
    this.handleCloseChartModal = this.handleCloseChartModal.bind(this);
    this.updateValidTime = this.updateValidTime.bind(this);
    this.handlePopupChartClick = this.handlePopupChartClick.bind(this);
    this.layerLoadError = this.layerLoadError.bind(this);
  }

  handlePopupChartClick(e) {
    // debugger
    // TODO: parse data-chart-type so we know the ajax call to make
    // Other params can be found in _source.options

    // e.sourceTarget._popup._source.options (coords in here..)
    // e.sourceTarget._popup._contentNode (TODO need a data attr from it.. JS regex?)
    this.setState({chartModalOpen: true});
  }

  inititializeMap(id) {
    // if (this.state.map) return;
    if (this.map) return;

    let map = this.map = L.map(id, mapConfig.params);
    L.esri.basemapLayer("DarkGray").addTo(map); // DarkGray

    // zoom control position
    L.control.zoom({
         position:'topright'
    }).addTo(map);

    // add click event listener
    map.on('click', this.onMapClick);

    // add move event listener (for lease blocks).. seems to handle zoom change too
    map.on('moveend', this.onMapBoundsChange); // moveend, zoomend

    // add click event listener to map (its really on popup but I fire a map event) 
    map.on('chartClick', e => {this.handlePopupChartClick(e)});

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

  getMapDimensionInfo() {
    let max_lat = this.map.getBounds()._northEast.lat;
    let min_lat = this.map.getBounds()._southWest.lat;
    let min_lon = this.map.getBounds()._southWest.lng;
    let max_lon = this.map.getBounds()._northEast.lng;

    let neCorner = L.CRS.EPSG3857.project(L.latLng(max_lat, max_lon));
    let swCorner = L.CRS.EPSG3857.project(L.latLng(min_lat, min_lon));
    let imageBounds = [[min_lat,min_lon],[max_lat,max_lon]]
        
    let width = this._mapNode.current.clientWidth;
    let height = this._mapNode.current.clientHeight;

    return {imageBounds, neCorner, swCorner, width, height}
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
            id,
            dataset,
            subResource,
            isOn: layerObj['defaultOn'], 
            level: levels[0],
            validTime: '',
            overlayType: layerObj['overlayType'],
            timeSensitive: layerObj['timeSensitive'], 
            addDataFunc: layerObj['addDataFunc'],
            maxNativeZoom: layerObj['maxNativeZoom'],
            minNativeZoom: layerObj['minNativeZoom'],
            maxVelocity: layerObj['maxVelocity'],
            velocityScale: layerObj['velocityScale'],
            streamFlowColorScale: layerObj['streamFlowColorScale'],
            streamFlowLayer: layerObj['streamFlowLayer'],
            overlayPriority: layerObj['overlayPriority'],
            opacity: layerObj['defaultOpacity']
          };

          // add layer id to metOceanLayers list (this list maintains the order the layers are in)
          metOceanLayers.push(id);
        }
      }
    }

    let metOceanInjectionIndex = this.state.orderedMapLayers.indexOf('MetOcean');
    if (metOceanInjectionIndex > -1) {
      orderedMapLayers[metocDatasetMappingIndx] = metOceanLayers;
      orderedMapLayers = [].concat(...orderedMapLayers)
    }

    this.setState({
      toc: categories, 
      isLoading: false, 
      initializedLayers: true, 
      mapLayers: mapLayers, 
      orderedMapLayers
    }, () => {
      this.state.orderedMapLayers.forEach(individualLayer => {
        if (this.state.mapLayers[individualLayer]['isOn']) {
          this.addLeafletLayer(this.state.mapLayers[individualLayer])
        }
      })
    })
  }

  /**
   * Fired when a layer is switched on/off
   * @param {str} layerID layer ID
   * @param {event} event
   */
  handleLayerToggle(layerID, event) {

    // dont mutate state data
    let layerIndx, mapLayers = Object.assign({}, this.state.mapLayers), 
      orderedMapLayers = [...this.state.orderedMapLayers], transparentBasemapID = 'transparent_basemap',
      transparentBasemapIndx;

    // get the index of the layer and of the transparent basemap (if necessary)
    layerIndx = orderedMapLayers.indexOf(layerID);

    // if turning the layer on find out where it was in the list... remove it from there and add to the end of the list
    if (event.target.checked) {
      orderedMapLayers.splice(layerIndx,1);
      orderedMapLayers.push(layerID);
      
      // need to update position of transparent basemap in certain cases
      if (mapLayers[layerID]['overlayType'] === 'all') {
        transparentBasemapIndx = orderedMapLayers.indexOf(transparentBasemapID);
      }

      if (transparentBasemapIndx) {
        orderedMapLayers.splice(transparentBasemapIndx,1);
        orderedMapLayers.push(transparentBasemapID);
      }
      this.addLeafletLayer({...mapLayers[layerID], isOn: true});
    } else {
      mapLayers[layerID]['isLoading'] = false;
      this.removeLeafletLayer(layerID); 
    }

    // logic to update status of transparent basemap if necessary
    if (transparentBasemapIndx) {
      mapLayers[transparentBasemapID]['isOn'] = event.target.checked
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

    this.setState({mapLayers}, () => {
      this.removeLeafletLayer(layerID);
      this.addLeafletLayer(mapLayers[layerID]);
    });
  }

  /**
   * Fired when the time is changed via the slider
   * @param {int} JS datetime in milliseconds
   */
  handleTimeChange(timeValue) {
    this.setState({mapTime: timeValue},()=> {
      this.debouncedUpdateLeafletLayer(); 
    });
  }

  /**
   * Fired when the time is changed via the slider. This function updates
   * the date valid time of a particular layer
   * 
   * @param {str} layerID
   * @param {int} validTime JS time in ms
   */
  updateValidTime(layerID,validTime) {
    let mapLayers = Object.assign({},this.state.mapLayers);
    mapLayers[layerID]['validTime'] = validTime;
    mapLayers[layerID]['isLoading'] = false;
    this.setState({mapLayers});
  }

  /**
   * Loops through ordered layers and checks if a particular layer is sensitive to time.
   * A check is performed to see if the layer is on and remove it before adding the layer again
   * for the new map time. The function is debounced so to limit the frequency it can be invoked.
   *
   * Note: https://stackoverflow.com/questions/23123138/perform-debounce-in-react-js
   */
  debouncedUpdateLeafletLayer() {
    let mapLayers = Object.assign({},this.state.mapLayers), orderedMapLayers = [...this.state.orderedMapLayers];

    // loop through orderlayers and update necessary layers depending on timeSensitive param 
    orderedMapLayers.forEach((layer)=> {
      let layerObj = mapLayers[layer];
      if (layerObj['timeSensitive'] && layerObj['isOn']) {
        this.removeLeafletLayer(layerObj['id']).then(()=>{this.addLeafletLayer(layerObj)});
      }
    });
  }

  // this is necessary if a user rapidly turn on/off a layer leaflet DOM state and 
  // react app state may diverge
  checkLayerStatus(layerID) {
    if (!this.state.mapLayers[layerID]['isOn']) {
      this.removeLeafletLayer(layerID)
    }
  }

  /**
   * Adds various leaflet layers using different logic depending on the addFuncType prop of 
   * a given layer
   * 
   * @param {obj} layerObj
   */
  addLeafletLayer(layerObj) {
    let addFuncType = layerObj['addDataFunc'], mapLayers = Object.assign({},this.state.mapLayers),
    mapProps, layerEndpointUrl;
    // set loading state as soon as possible for smooth workflow
    mapLayers[layerObj['id']]['isLoading'] = true;
    this.setState({mapLayers}, () => {
      switch(addFuncType) {
        case 'getModelField':
          getModelField(layerObj['dataset'], layerObj['subResource'], layerObj['level'], this.state.mapTime).then(
            res => {
              // error handling if response returns an error
              if (res['error']) {
                mapLayers[layerObj['id']]['loadError'] = true;
                mapLayers[layerObj['id']]['isLoading'] = false;
                this.setState({mapLayers});
                return
              }

              let data = JSON.parse(res['data']);
              // update valid time here.. check if requested date is outside of data range
              if (!res['tile_paths']) {
                this.updateValidTime(layerObj['id'], 'n/a')
                return
              } else {
                this.updateValidTime(layerObj['id'], res['valid_time'])
              }

              // add tile and streamflow data
              let maxVelocity = layerObj['maxVelocity'];
              let velocityScale = layerObj['velocityScale'];
              let streamFlowColorScale = layerObj['streamFlowColorScale'];
              this.buildMetocTileLayer(layerObj,res).then(tileLayer => { 
                if (this.layerBindings.hasOwnProperty(layerObj['id'])) {
                  this.removeLeafletLayer(layerObj['id']).then(() => {

                    // add tile layer
                    this.addToLeafletLayerGroup(tileLayer, layerObj, false)

                    // TODO: this logic is repeated below in else block
                    // add transparent basemap
                    if (layerObj['overlayType'] === 'all') {
                      let transparentBasemap = mapLayers['transparent_basemap'];
                      this.buildGeneralTileLayer(transparentBasemap,transparentBasemap['endPoint']).then(tileMapLayer => {
                        this.addLayer(transparentBasemap,tileMapLayer);
                      });
                    }

                    // add stream layer
                    if (layerObj['streamFlowLayer']) {
                      this.buildStreamlineLayer(data, maxVelocity, velocityScale, streamFlowColorScale).then(streamLayer => {
                        this.addToLeafletLayerGroup(streamLayer, layerObj, true)
                      })
                    }
                  })
                } else {
                  // add tile layer
                  this.addToLeafletLayerGroup(tileLayer, layerObj, false)

                  // new (TODO: repeated logic.. wrap this logic in a function)
                  // add transparent basemap
                  if (layerObj['overlayType'] === 'all') {
                    let transparentBasemap = mapLayers['transparent_basemap'];
                    
                    let extraOptions = {
                      minNativeZoom: transparentBasemap['minNativeZoom'], 
                      maxNativeZoom: transparentBasemap['maxNativeZoom']
                    };

                    this.buildGeneralTileLayer(transparentBasemap,transparentBasemap['endPoint'],extraOptions).then(
                      tileMapLayer => {
                      this.addLayer(transparentBasemap,tileMapLayer);
                    });
                  }
                  // end new

                  if (layerObj['streamFlowLayer']) {
                    this.buildStreamlineLayer(data, maxVelocity, velocityScale, streamFlowColorScale).then(streamLayer => {
                      this.addToLeafletLayerGroup(streamLayer, layerObj, true)
                    })
                  }
                }
              })
            }
          ).catch(alert) // TODO: make a formal modal out of this
          break;
        case 'getGebcoBathy':
          this.buildGeneralTileLayer(layerObj,layerObj['endPoint']).then(tileLayer => { 
            this.addLayer(layerObj,tileLayer);
          })
          break;
        case 'getLeaseAreas':
          mapProps = this.getMapDimensionInfo();
          layerEndpointUrl = populateImageUrlEndpoint(layerObj['endPoint'], mapProps);
          this.buildImageLayer(layerObj,layerEndpointUrl,mapProps['imageBounds']).then(imageLayer => { 
            this.addLayer(layerObj,imageLayer);
          })
          break;
        case 'getLeaseBlocks':
          mapProps = this.getMapDimensionInfo();
          layerEndpointUrl = populateImageUrlEndpoint(layerObj['endPoint'], mapProps);
          this.buildImageLayer(layerObj,layerEndpointUrl,mapProps['imageBounds']).then(imageLayer => { 
            this.addLayer(layerObj,imageLayer);
          })
          break;
        case 'getActiveDrilling':
          getData(layerObj['endPoint']).then(drillingData => {
            // if unable to get drilling data then update state and halt execution
            if (drillingData['error']) {
              this.layerLoadError(layerObj);
              return
            }

            let drillingLayer = this.buildActiveDrillingLayer(drillingData);
            this.addLayer(layerObj,drillingLayer);
            mapLayers[layerObj['id']]['isLoading'] = false;
            this.setState({mapLayers});
          });
          break;
        case 'getTropicalActivity':
          mapProps = this.getMapDimensionInfo();

          // TODO: for this layer we also need to fetch legend and
          // endpoints are defined in layers.js
          layerEndpointUrl = populateImageUrlEndpoint(layerObj['endPoint'], mapProps);
          this.buildImageLayer(layerObj,layerEndpointUrl,mapProps['imageBounds']).then(imageLayer => { 
            // get legend here and the info.. wait for both requests to finish
            let endpointInfo = getData(layerObj['endPointInfo']);
            let legendContent = getData(layerObj['legendUrl'], 'text');
            
            Promise.all([endpointInfo, legendContent]).then(resp => {
              if (resp[0]['error'] || resp[1]['error']) {
                this.layerLoadError(layerObj);
                return
              }
              
              mapLayers[layerObj['id']]['prodTimeLabel'] = resp[0]['prodTimeLabel'];
              mapLayers[layerObj['id']]['prodTime'] = moment.utc(resp[0]['prodTime']).format('YYYY-MM-DDTHH:mm[Z]');
              mapLayers[layerObj['id']]['legendContent'] = resp[1];
              this.addLayer(layerObj,imageLayer);
              this.setState({mapLayers});
            })
          })
          break;
          // TODO: fetch in the same way i do in componentDidMount.. clean up the call though (both here and there)
          // to make use of imported functionality from dataFetchingUtils.js
        default:
          //code block
      }
    })
  }

  /**
   * Asynchronous function to remove a leaflet layer and update layerBindings object of the parent class. 
   * A check is perfomed to see if streamlines exist for a particular layer and removes
   * that layer as well if it is found.
   * 
   * @param {str} layerID the layer id (as stored in state)
   */
  async removeLeafletLayer(layerID) {
    let mapLayers = Object.assign({},this.state.mapLayers)

    try {
      if (mapLayers[layerID]['overlayType'] === 'all') {
        await this.leafletLayerGroup.removeLayer(this.layerBindings['transparent_basemap']);
        delete this.layerBindings['transparent_basemap'];
      }
      await this.leafletLayerGroup.removeLayer(this.layerBindings[layerID]);
      delete this.layerBindings[layerID];

      if (this.layerBindings.hasOwnProperty(`${layerID}_streamlines`)) {
        await this.leafletLayerGroup.removeLayer(this.layerBindings[`${layerID}_streamlines`]);
        delete this.layerBindings[`${layerID}_streamlines`]
      }

    } catch (err) {
      console.log(err);
    }
  }

  addLayer(layerObj, leafletLayer){
    if (this.layerBindings.hasOwnProperty(layerObj['id'])) {
      this.removeLeafletLayer(layerObj['id']).then(() => {
        this.addToLeafletLayerGroup(leafletLayer, layerObj, false);
      })
    } else {
      this.addToLeafletLayerGroup(leafletLayer, layerObj, false);
    }
  }

  addToLeafletLayerGroup(layerHandle, layerObj, streamline=false) {
    this.leafletLayerGroup.addLayer(layerHandle);
    let lid_layer = this.leafletLayerGroup.getLayerId(layerHandle);
    let layerKeyStr = streamline ? `${layerObj['id']}_streamlines` : layerObj['id'];
    this.layerBindings[layerKeyStr] = lid_layer;
  }

  async buildMetocTileLayer(layerObj,res) {
    let mapLayers = Object.assign({}, this.state.mapLayers);

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

    // set tile layer events
    tileLayer.on('loading', (function() {
      // ensure the layer is still on when this is triggered.. a fast on/off toggle might complete
      // before even getting here.. and I don't want the spinner to blip on/off
      if (mapLayers[layerObj['id']]['isOn']) {
        mapLayers[layerObj['id']]['isLoading'] = true;
        mapLayers[layerObj['id']]['loadError'] = false;
        this.setState({mapLayers});
      }
    }).bind(this));

    tileLayer.on('load', (function() {
      mapLayers[layerObj['id']]['isLoading'] = false;
      // check if the layer is still on when load is complete 
      // (need to keep DOM and react state in sync)
      this.checkLayerStatus(layerObj['id']);
      this.setState({mapLayers});
    }).bind(this));

    tileLayer.on('tileerror', (function() {
      this.layerLoadError(layerObj);
    }).bind(this));

    return tileLayer;
  }

  async buildStreamlineLayer(data, maxVelocity, scale, streamFlowColorScale=[]) {
    let velocityLayer = await L.velocityLayer({
      displayValues: false,
      displayOptions: {
        velocityType: 'fluid',
        displayPosition: 'bottomleft',
        displayEmptyString: 'No velocity data'
      },
      data: data,
      maxVelocity: maxVelocity, //20.0,
      velocityScale: scale, // 0.01 // arbitrary default 0.005
      colorScale: ['#ffffff'] // ['#ffffff','#d9d9d9','#969696','#525252','#000000'] // use gray scale for all 
    });
    return velocityLayer;
  }

  async buildGeneralTileLayer(layerObj, endpointURL, extraOptions = {}, wmsTileLayer = false) {
    let mapLayers = Object.assign({}, this.state.mapLayers);

    // add tile imagery data
    let tileOptions = {opacity: layerObj['opacity'], ...extraOptions};

    // add pane as an option if the layer contains overlayPriority key
    tileOptions = layerObj['overlayPriority'] ? {...tileOptions, pane: layerObj['overlayPriority']} : tileOptions;

    let outputTileLayer;
    if (wmsTileLayer) {
      outputTileLayer = await L.tileLayer.wms(endpointURL,tileOptions);
    } else {
      outputTileLayer = await L.tileLayer(endpointURL,tileOptions);
    }

    // set tile layer events
    outputTileLayer.on('loading', (function() {
      // double check layer is still on
      if (mapLayers[layerObj['id']]['isOn']) {
        mapLayers[layerObj['id']]['loadError'] = false;
        this.setState({mapLayers});
      }
    }).bind(this));

    outputTileLayer.on('load', (function() {
      mapLayers[layerObj['id']]['isLoading'] = false;
      // check if the layer is still on (need to keep DOM and react state in sync)
      this.checkLayerStatus(layerObj['id']);
      this.setState({mapLayers});
    }).bind(this));

    outputTileLayer.on('tileerror', (function() {
      this.layerLoadError(layerObj);
    }).bind(this));

    return outputTileLayer;
  }

  async buildImageLayer(layerObj, imageEndpoint, imageBounds) {
    let mapLayers = Object.assign({}, this.state.mapLayers);

    let imageOptions = {
      opacity: layerObj['opacity']
    }

    // add pane as an option if the layer contains overlayPriority key
    imageOptions = layerObj['overlayPriority'] ? {...imageOptions, pane: layerObj['overlayPriority']} : imageOptions;
    let imageLayer = await L.imageOverlay(imageEndpoint, imageBounds, imageOptions);

    // set some image layer events
    imageLayer.on('add', (function() {
      // setting isLoading to true might be redundant but leave it 
      mapLayers[layerObj['id']]['isLoading'] = true;
      mapLayers[layerObj['id']]['loadError'] = false;
      this.setState({mapLayers});
    }).bind(this));

    imageLayer.on('load', (function() {
      mapLayers[layerObj['id']]['isLoading'] = false;
      // check if the layer is still on (need to keep DOM and react state in sync)
      this.checkLayerStatus(layerObj['id']);
      this.setState({mapLayers});
    }).bind(this));

    imageLayer.on('error', (function() {
      this.layerLoadError(layerObj);
    }).bind(this));

    return imageLayer;
  }

    /**
   * Builds active drilling layer by creating a layer group and inserting a marker for each location
   * 
   * @param {array} drilingArray list of active drilling sites stored in s3 bucket in a json file)
   */
  buildActiveDrillingLayer(drillingArray) {

    const drillingMarkerParams = {
      radius: 4,
      fillColor: '#00ff00',
      color: '#ffffff',
      weight: 0.1,
      opacity: 1,
      fillOpacity: 1
    };

    let layer, drillingMarker, popupStationContent, activeDrillingLayer = L.layerGroup([]);
    let buttonContent = buildActiveDrillingPopupButtons();

    drillingArray.forEach(drillSite => {

      popupStationContent = buildActiveDrillingPopupStationContent(drillSite);
      try {
        drillingMarker = L.marker(drillSite['coordinates'].reverse(), 
          {...drillingMarkerParams, ...drillSite, popupStationContent});

        window.mymap = this.map
        drillingMarker.bindPopup(`${popupStationContent}${buttonContent}`);

        activeDrillingLayer.addLayer(drillingMarker);

        drillingMarker.on('popupopen', (function(getAppState, markerContext) {

          let mapLayers = getAppState()['mapLayers'];
          let orderedMapLayers = getAppState()['orderedMapLayers'];

          let activeLayers = [];
          orderedMapLayers.forEach(layer => {
            if (mapLayers[layer]['dataset'] && mapLayers[layer]['isOn']) activeLayers.push(mapLayers[layer]);
          })

          // TODO do i show buttons when no layers are on?

          let origPopupContent = markerContext.popup._source.options.popupStationContent;
          let modelOutputContent = '';

          if (activeLayers.length) {
            let dataContent = `<span>Fetching Model Output<div class="loader loader-popup small"></div><span>`;
            markerContext.popup.setContent(`${origPopupContent}${dataContent}${buttonContent}`)
            
            let pointData, pointFetchArray = [];
            let markerCoords = markerContext.popup._source.options.coordinates.slice().reverse();
            
            activeLayers.forEach(activeLayer => {
              pointData = getPointData(activeLayer['dataset'],activeLayer['subResource'],
                activeLayer['level'],getAppState()['mapTime'], markerCoords);
              pointFetchArray.push(pointData);
            })
            
            Promise.all(pointFetchArray).then(responses => {
              responses.forEach(resp => {
                // TODO: deal with errors and fix naming of dataset
                let model = resp['model'];
                let value = resp['data']['val'].toFixed(2);
                let units = resp['units'];
                let dataStr = `<p style='margin: 5px 0px'>${model}: ${value} (${units})</p>`;
                modelOutputContent += dataStr;
              });
              // update popup content
              markerContext.popup.setContent(
                `${origPopupContent}${modelOutputContent}${buttonContent}`
              )
            })
            
          }
        }).bind(this, () => { return this.state }));

        // reset the contents when closing the popup
        drillingMarker.on('popupclose', (function(markerContext) {
          markerContext.popup.setContent(`${markerContext.popup._source.options.popupStationContent}${buttonContent}`);
        }).bind(this));
      } catch(err) {
        console.log(err);
      }
    }, this)

    return activeDrillingLayer;
  }

  layerLoadError(layerObj) {
    let mapLayers = Object.assign({}, this.state.mapLayers);
    mapLayers[layerObj['id']]['isLoading'] = false;
    mapLayers[layerObj['id']]['loadError'] = true;
    this.setState({mapLayers});
  }

  onMapClick(e) {
    let popupContent = `<h4>${e.latlng.toString()}</h4>`;
    let pulsingIcon = L.icon.pulse({iconSize:[10,10],color:this.props.theme.palette.secondary.main});
    let marker = L.marker(e.latlng,{icon: pulsingIcon}).bindPopup(popupContent);
    marker.on('popupclose',() => marker.removeFrom(this.map));
    marker.addTo(this.map);
    marker.openPopup();
  }

  onMapBoundsChange() {
    // TODO this basically repeats some logic i already have... see if we can move this logic into a func..
    // pass the prop I care about.. movementSensitive.. timeSensitive
    let mapLayers = Object.assign({},this.state.mapLayers), orderedMapLayers = [...this.state.orderedMapLayers];
    
    // loop through orderlayers and update necessary layers depending on timeSensitive param 
    orderedMapLayers.forEach((layer)=> {
      let layerObj = mapLayers[layer];
      if (layerObj['movementSensitive'] && layerObj['isOn']) {
        this.removeLeafletLayer(layerObj['id']).then(()=>{this.addLeafletLayer(layerObj)});
      };
    });
  }

  handleCloseChartModal() {
    this.setState({chartModalOpen: false});
  }

  componentWillMount() {
    let categories = [...this.state.toc], mapLayers = Object.assign({},this.state.mapLayers), 
      orderedMapLayers = [...this.state.orderedMapLayers];

    categories.forEach((category, outerIndx) => {
      if (category['Category'] !== 'MetOcean' && category['visibleTOC']) {
        category['Layers'].forEach((layerObj, innerIndx) => {
          let id = layerObj['id'];
          mapLayers[id] = {
            id,
            isOn: layerObj['defaultOn'],
            nowCoastDataset: layerObj['nowCoastDataset'] || false,
            timeSensitive: layerObj['timeSensitive'] || false,
            movementSensitive: layerObj['movementSensitive'] || false,
            minNativeZoom: layerObj['minNativeZoom'],
            maxNativeZoom: layerObj['maxNativeZoom'],
            addDataFunc: layerObj['addDataFunc'],
            opacity: layerObj['defaultOpacity'] || 1,
            overlayPriority: layerObj['overlayPriority'],
            endPoint: layerObj['endPoint'],
            endPointInfo: layerObj['endPointInfo'],
            legendUrl: layerObj['legendUrl']
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
    let categories = [...this.state.toc];

    if (!this.map) {
      // create the Leaflet map object
      this.inititializeMap(this._mapNode.current);
    }

    let metocDatasetMappingIndx = this.findObjIndex(categories, 'Category', 'MetOcean');
    let fetchDataAvailablity = categories[metocDatasetMappingIndx]['visibleTOC'];
    // https://www.robinwieruch.de/react-fetching-data/
    // abort if MetOcean category isnt visible in TOC
    if (fetchDataAvailablity) {
      getData('/download/data_availability.json').then(data => {
        if (data['error']) {
          this.setState({isLoadingMetoc: false, metocLoadError: true}, () => {
            // attempt to add non metoc layers to map even if we had an error fetching metoc data
            this.state.orderedMapLayers.forEach(nonMetocLayer => {
                if (nonMetocLayer !== 'MetOcean') {
                  if (this.state.mapLayers[nonMetocLayer]['isOn']) this.addLeafletLayer(this.state.mapLayers[nonMetocLayer])
                }
              }
            )
          });
          return
        }
        // populate levels if no error
        this.setState({isLoadingMetoc: false, metocLoadError: false}, () => {
          this.populateAvailableLevels(data)
        });
      })

    } else {
      this.setState({
        isLoadingMetoc: false, 
        initializedLayers: true, 
        metocLoadError: false
      }, () => {
        // add non metoc layers to map 
        this.state.orderedMapLayers.forEach(nonMetocLayer => {
            if (nonMetocLayer !== 'MetOcean') {
              if (this.state.mapLayers[nonMetocLayer]['isOn']) this.addLeafletLayer(this.state.mapLayers[nonMetocLayer])
            }
          }
        )
      })
    }
  }

  render() {
    const { classes } = this.props;

    return (
      <div>
        <PersistentDrawerLeft 
          handleLayerToggle = {this.handleLayerToggle}
          handleLevelChange = {this.handleLevelChange}
          handleTimeChange = {this.handleTimeChange}
          {...this.state}
        />
        <div ref={this._mapNode} id="map" className={classNames(classes.map)} />
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

