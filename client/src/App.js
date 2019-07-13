import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import './App.css';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import PersistentDrawerLeft from './components/PersistentDrawerLeft';
import ChartModal from './components/ChartModal';
import SettingsPanel from './components/SettingsPanel';
import CoordinateDisplay from './components/CoordinateDisplay';
import { layers, dataLayers } from './scripts/layers';
import moment from 'moment';
import { getData, getModelField, abortLayerRequest } from './scripts/dataFetchingUtils';
import { populateImageUrlEndpoint, buildTileFetchEndpoint } from './scripts/formattingUtils';
import { addCustomLeafletHandlers } from './scripts/addCustomLeafletHandlers';
import { activeDrillingPopupStaticContent ,
         customLocationPopupStaticContent } from './scripts/buildStaticPopupContent';
import { buildDynamicPopupContent } from './scripts/buildDynamicPopupContent';
import { parseData } from './scripts/parseData';
import priorityMap from './scripts/layerPriority';
import { mapConfig } from './scripts/mapConfig';
import _ from 'lodash';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as esri from 'esri-leaflet';
import 'jquery';
import 'leaflet-velocity/dist/leaflet-velocity';
import 'leaflet-velocity/dist/leaflet-velocity.css';
import '@ansur/leaflet-pulse-icon/dist/L.Icon.Pulse.js';
import '@ansur/leaflet-pulse-icon/dist/L.Icon.Pulse.css';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

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
      chartModalOpen: false,
      chartLoading: false,
      chartData: null,
      settingsPanelOpen: false
    };

    this._mapNode = React.createRef();
    this.inititializeMap = this.inititializeMap.bind(this);
    this.getMapDimensionInfo = this.getMapDimensionInfo.bind(this);
    this.onMapClick = this.onMapClick.bind(this);
    this.onMapBoundsChange = this.onMapBoundsChange.bind(this);
    this.onMapCursorChange = this.onMapCursorChange.bind(this);
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
    this.handleSettingsPanelVisibility = this.handleSettingsPanelVisibility.bind(this);
    this.handleSettingsPanelHide = this.handleSettingsPanelHide.bind(this);
    this.handleLayerSettingsUpdate = this.handleLayerSettingsUpdate.bind(this);
    this.updateLayerTimeInfo = this.updateLayerTimeInfo.bind(this);
    this.handlePopupChartClick = this.handlePopupChartClick.bind(this);
    this.layerLoadError = this.layerLoadError.bind(this);
  }

  /**
   * Handles click on timeseries or profile plot text in map popup
   * @param {str} chartType (one of 'timeseries', 'profile')
   */
  handlePopupChartClick(chartType) {
    // add single abortController for all chart data fetch requests
    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    this.setState({
      chartModalOpen: true,
      chartType, 
      chartLoading: true, 
      chartAbortController: abortController
    }, () => {
      // trigger fetch and parsing of data
      parseData(this, chartType, abortSignal);
    });
  }

  /**
   * Initializes leaflet map and adds draw control. Empty layergroup is also
   * added to map. Some map events are tied to class functions. Layerbindings object
   * is initialized.
   *
   * @param {object} id map node
   */
  inititializeMap(id) {
    if (this.map) return;

    let map = this.map = L.map(id, mapConfig.params);
    esri.basemapLayer("Oceans").addTo(map); // DarkGray
    esri.basemapLayer("OceansLabels").addTo(map); // DarkGray

    // add custom handlers
    addCustomLeafletHandlers(L);

    // zoom control position (dont add if using mobile)
    if (!L.Browser.mobile) {
      L.control.zoom({
         position:'topright'
      }).addTo(map);
    }
    
    // add click event listener
    map.on('click', this.onMapClick);

    // add move event listener (for lease blocks)
    map.on('moveend', this.onMapBoundsChange); // moveend, zoomend

    // add click event listener to map (fired when clicking on specific popup element) 
    map.on('timeseriesClick', () => {this.handlePopupChartClick('timeseries')});

    // add click event listener to map (ired when clicking on specific popup element) 
    map.on('profileClick', () => {this.handlePopupChartClick('profile')});

    // add a mousemove event listener to map to track lat/lng coordinates
    map.on('mousemove', ev => {this.onMapCursorChange(ev.latlng.lat, ev.latlng.lng)});

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
   * Used to determine image bounds (i.e. lower left corner lon/lat and 
   * upper right corner lon/lat). Also returned is the lower left corner
   * and upper right corner coordinates transformed into EPSG:3857. Map width
   * and height determined from the viewport is also returned.
   */
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
    let dataset, subResource, levels, levelUnit, categories = [...this.state.toc], 
      metOceanLayers = [], mapLayers = Object.assign({},this.state.mapLayers), 
      orderedMapLayers = [...this.state.orderedMapLayers];
    
    let metocDatasetMappingIndx = this.findObjIndex(categories, 'Category', 'MetOcean');
    let orderedMetOceanLayers = categories[metocDatasetMappingIndx]['Layers'].map(
      (model, indx) => ({model: model['s3Name'], index: indx}));

    for (let indx=0; indx<orderedMetOceanLayers.length; indx++) {
      dataset = orderedMetOceanLayers[indx]['model'];
      // if the dataset doesnt exist within available datasets returned from s3 or if its empty continue
      if (!Object.keys(data).includes(dataset) || !Object.keys(data[dataset]).length) {
        // TODO: remove empty dataset from categories -- should clean up categories
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
          let id = layerObj['id'];
          
          levels = Object.keys(data[dataset][subResource]['level']).map(level => parseInt(level)).sort(function(a, b){return a-b});
          levelUnit = Object.keys(data[dataset][subResource]['level'])[0].match(/[a-z]+/gi) ?
            Object.keys(data[dataset][subResource]['level'])[0].match(/[a-z]+/gi)[0] : '';
          
          categories[metocDatasetMappingIndx]['Layers'][indx]['subResources'][innerIndx]['availableLevels'] = levels;

          mapLayers[id] = {
            id,
            dataset,
            subResource,
            niceName: layerObj['niceName'],
            shortName: layerObj['shortName'],
            isOn: layerObj['defaultOn'], 
            level: levels[0],
            levelUnit,
            validTime: '',
            overlayType: layerObj['overlayType'],
            timeSensitive: layerObj['timeSensitive'], 
            addDataFunc: layerObj['addDataFunc'],
            chartType: layerObj['chartType'],
            directionConvention: layerObj['directionConvention'],
            maxNativeZoom: layerObj['maxNativeZoom'],
            minNativeZoom: layerObj['minNativeZoom'],
            maxVelocity: layerObj['maxVelocity'],
            velocityScale: layerObj['velocityScale'],
            streamFlowColorScale: layerObj['streamFlowColorScale'],
            streamFlowLayer: layerObj['streamFlowLayer'],
            overlayPriority: layerObj['overlayPriority'],
            rasterProps: {...layerObj['rasterProps']},
            settingsTools: layerObj['settingsTools']
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
  updateLayerTimeInfo(layerID,validTime,initTime) {
    let mapLayers = Object.assign({},this.state.mapLayers);
    mapLayers[layerID]['validTime'] = validTime;
    mapLayers[layerID]['initTime'] = initTime;
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

  /**
   * Check the app state for layer status to keep map and app state in sync. This 
   * is necessary if a user rapidly turns on/off a layer and app state diverges from map state.
   * Leaflet manipulates the DOM directly and React works by diffing virtual DOM and present DOM.
   * If the layer is not on (in state) but Leaflet just finished adding it to the map then we need
   * to remove it. 
   *
   * @param {str} layerID the layer id
   */
  checkLayerStatus(layerID) {
    if (!this.state.mapLayers[layerID]['isOn']) {
      this.removeLeafletLayer(layerID)
    }
  }

  /**
   * Gateway function for adding a layer to map. Based on the specific 'addDataFunc'
   * of a layer different workflows are invoked.
   *
   * @param {obj} layerObj object that provides layer specific information
   */
  addLeafletLayer(layerObj) {
    let addFuncType = layerObj['addDataFunc'], mapLayers = Object.assign({},this.state.mapLayers),
      abortSignal, mapProps, layerEndpointUrl;

    // assign abort signal to layers which fetch external data which is returned in json format
    if (dataLayers.indexOf(mapLayers[layerObj['id']]['addDataFunc']) > -1) {
      const controller = new AbortController();
      mapLayers[layerObj['id']]['abortController'] = controller;
    }

    // set loading state as soon as possible for smooth workflow
    mapLayers[layerObj['id']]['isLoading'] = true;
    this.setState({mapLayers}, () => {
      switch(addFuncType) {
        case 'getModelField':
          // pass abort controller signal to getModelField
          abortSignal = this.state.mapLayers[layerObj['id']]['abortController']['signal'];
          getModelField(layerObj['dataset'], layerObj['subResource'], layerObj['level'], 
            this.state.mapTime, abortSignal).then(
            res => {
              // error handling if response returns an error
              if (res['error']) {
                this.layerLoadError(layerObj);
                return
              }

              let data = JSON.parse(res['data']);
              // update valid time here.. check if requested date is outside of data range
              if (!res['tile_paths']) {
                this.updateLayerTimeInfo(layerObj['id'], 'n/a', 'n/a')
                return
              } else {
                this.updateLayerTimeInfo(layerObj['id'], res['valid_time'],res['init_time'])
              }

              // add tile and streamflow data
              let maxVelocity = layerObj['maxVelocity'];
              let velocityScale = layerObj['velocityScale'];
              let streamFlowColorScale = layerObj['streamFlowColorScale'];
              this.buildMetocTileLayer(layerObj,res).then(tileLayer => {

                // this line tricks the event loop
                // TODO: remove this
                tileLayer.on('load',()=> {
                  // console.log('layer just loaded!!')
                });

                this.removeLeafletLayer(layerObj['id']).then(() => {
                  // add tile layer
                  this.addToLeafletLayerGroup(tileLayer, layerObj, false)

                  // add transparent basemap
                  if (layerObj['overlayType'] === 'all') {
                    let transparentBasemap = mapLayers['transparent_basemap'];
                    
                    let extraOptions = {
                      minNativeZoom: transparentBasemap['minNativeZoom'], 
                      maxNativeZoom: transparentBasemap['maxNativeZoom']
                    };

                    this.buildGeneralTileLayer(transparentBasemap,transparentBasemap['endPoint'],extraOptions).then(tileMapLayer => {
                      this.addLayer(transparentBasemap,tileMapLayer);
                    });
                  }

                  if (layerObj['streamFlowLayer']) {
                    this.buildStreamlineLayer(data, maxVelocity, velocityScale, streamFlowColorScale).then(streamLayer => {
                      this.addToLeafletLayerGroup(streamLayer, layerObj, true)
                    })
                  }
                })
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
        case 'getLeaseBlocks':
          mapProps = this.getMapDimensionInfo();
          layerEndpointUrl = populateImageUrlEndpoint(layerObj['endPoint'], mapProps);
          this.buildImageLayer(layerObj,layerEndpointUrl,mapProps['imageBounds']).then(imageLayer => {
            this.addLayer(layerObj,imageLayer);
          })
          break;
        case 'getActiveDrilling':
          // pass abort controller signal to getModelField
          abortSignal = this.state.mapLayers[layerObj['id']]['abortController']['signal'];
          getData(layerObj['endPoint'],'json',abortSignal).then(drillingData => {
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

    // abort the request to keep workflow smooth and data usage at a minimum
    abortLayerRequest(layerID, this, L);

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

  /**
   * Supporting function for addToLeafletLayerGroup which first checks
   * if the layer exists already in layerBindings class object. If it does
   * the layer needs to be removed before being added again.
   *
   * @param {obj} layerObj layer object that provides layer specific information
   * @param {obj} leafletLayer leaflet layer
   */
  addLayer(layerObj, leafletLayer){
    if (this.layerBindings.hasOwnProperty(layerObj['id'])) {
      this.removeLeafletLayer(layerObj['id']).then(() => {
        this.addToLeafletLayerGroup(leafletLayer, layerObj, false);
      })
    } else {
      this.addToLeafletLayerGroup(leafletLayer, layerObj, false);
    }
  }

  /**
   * Add layer to map layer group that contains all pertinent TOC layers.
   * The layer leaflet id is used to update layerBinding class object for 
   * future reference.
   *
   * @param {obj} layerHandle leaflet layer
   * @param {obj} layerObj layer object that provides layer specific information
   * @param {bool} streamline 
   */
  addToLeafletLayerGroup(layerHandle, layerObj, streamline=false) {
    this.leafletLayerGroup.addLayer(layerHandle);
    let lid_layer = this.leafletLayerGroup.getLayerId(layerHandle);
    let layerKeyStr = streamline ? `${layerObj['id']}_streamlines` : layerObj['id'];
    this.layerBindings[layerKeyStr] = lid_layer;
  }

  /**
   * Build a metoc tile layer (a layer comprised of tiles stored in my s3 bucket)
   *
   * @param {obj} layerObj layer object that provides layer specific information
   * @param {obj} res this is a response object returned from call to aws api gateway
   */
  async buildMetocTileLayer(layerObj,res) {
    let mapLayers = Object.assign({}, this.state.mapLayers);
    
    // add tile imagery data
    let tileOptions = {
      opacity: layerObj['rasterProps']['opacity'],
    }

    // add pane as an option is the layer contains overlayPriority key
    tileOptions = layerObj['overlayPriority'] ? {...tileOptions, pane: layerObj['overlayPriority']} : tileOptions;
    
    let tileLayerEndpoint = buildTileFetchEndpoint(this.state.mapTime, layerObj)
    let tileLayer = await L.tileLayer(tileLayerEndpoint, tileOptions);

    // set tile layer events
    tileLayer.on('loading', (function() {
      // ensure the layer is still on when this is triggered.. a fast on/off toggle might complete
      // before even getting here.. and I don't want the spinner to blip on/off
      if (mapLayers[layerObj['id']]['isOn']) {
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
    let tileOptions = {opacity: layerObj['rasterProps']['opacity'], ...extraOptions};

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
      opacity: layerObj['rasterProps']['opacity']
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

    let drillingMarker, popupStationContent, activeDrillingLayer = L.layerGroup([]);
    drillingArray.forEach(drillSite => {
      popupStationContent = activeDrillingPopupStaticContent(drillSite);
      try {
        drillingMarker = L.marker(drillSite['coordinates'].reverse(), 
          {...drillSite, popupStationContent});
        
        window.mymap = this.map;
        drillingMarker.bindPopup(`${popupStationContent}`);
        activeDrillingLayer.addLayer(drillingMarker);

        drillingMarker.on('popupopen', (function(getAppState, markerContext) {
          buildDynamicPopupContent(getAppState,markerContext);
          this.setState({activeLocation: markerContext.popup._latlng});
        }).bind(this, () => { return this.state }));

        // reset the contents when closing the popup
        drillingMarker.on('popupclose', function(markerContext) {
          markerContext.popup.setContent(`${markerContext.popup._source.options.popupStationContent}`);
        });
      } catch(err) {
        console.log(err);
      }
    }, this)

    return activeDrillingLayer;
  }

  /**
   * Update layer loading and error status 
   */
  layerLoadError(layerObj) {
    let mapLayers = Object.assign({}, this.state.mapLayers);
    mapLayers[layerObj['id']]['isLoading'] = false;
    mapLayers[layerObj['id']]['loadError'] = true;
    this.setState({mapLayers});
  }

  /**
   * Generate a pulsing marker when a user clicks on the map. 
   */
  onMapClick(e) {
    // let initialPopupContent = `<h4>${e.latlng.toString()}</h4>`;
    let initialPopupContent = customLocationPopupStaticContent(e.latlng);
    let pulsingIcon = L.icon.pulse({iconSize:[10,10],color:this.props.theme.palette.secondary.main});
    let marker = L.marker(e.latlng,{icon: pulsingIcon}).bindPopup(initialPopupContent);

    marker.on('popupopen', (function(getAppState, markerContext) {
      buildDynamicPopupContent(getAppState,markerContext);
    }).bind(this, () => { return this.state }));
    marker.on('popupclose',() => marker.removeFrom(this.map));
    marker.addTo(this.map);
    marker.openPopup();

    // set active location
    this.setState({activeLocation: e.latlng}); // marker.popup._latlng
  }

  /**
   * Fired when map bounds change. Active layers with a 'movementSensitive'
   * attribute are refreshed. 
   */
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

  /**
   * Track the location of the cursor when hovering over the map
   * 
   * @param {lat} the present latitude of the cursor
   * @param {lng} the present longitude of the cursor
   */
  onMapCursorChange(lat, lng) {
    this.setState({cursorLat: lat, cursorLng: lng});
  }

  /**
   * Fired when chart modal is closed. State is updated.
   */
  handleCloseChartModal() {
    // abort any pending data fetching for chart
    this.state.chartAbortController.abort();
    this.setState({chartModalOpen: false});
  }

  handleSettingsPanelVisibility(layerID) {
    this.setState({
      activeSettingsLayer: layerID, 
      settingsPanelOpen: true
    })
  }

  handleSettingsPanelHide() {
    this.setState({settingsPanelOpen: false})
  }

  handleLayerSettingsUpdate(layerID, settingType, value) {
    let mapLayers = Object.assign({},this.state.mapLayers);
    let id = this.layerBindings[layerID];
    let leafletLayer = this.leafletLayerGroup.getLayer(id);
    
    if (settingType === 'data-range') {
      mapLayers[layerID]['rasterProps']['currentMin'] = value[0];
      mapLayers[layerID]['rasterProps']['currentMax'] = value[1];
      this.setState({mapLayers}, () => {
        let tileLayerEndpoint = buildTileFetchEndpoint(this.state.mapTime, this.state.mapLayers[layerID]);
        leafletLayer.setUrl(tileLayerEndpoint);
      })
    } else if (settingType === 'opacity') {
      let decimalOpacity = value[0]/100;
      mapLayers[layerID]['rasterProps']['opacity'] = decimalOpacity;
      this.setState({mapLayers},() => {
        this.leafletLayerGroup.getLayer(id).setOpacity(decimalOpacity);
      });  
    } else if (settingType === 'colormap') {
      mapLayers[layerID]['rasterProps']['colormap'] = value;
      this.setState({mapLayers},() => {
        let tileLayerEndpoint = buildTileFetchEndpoint(this.state.mapTime, this.state.mapLayers[layerID]);
        leafletLayer.setUrl(tileLayerEndpoint);
      });  
    } else if (settingType === 'interval') {
      mapLayers[layerID]['rasterProps']['interval'] = Number(value);
      this.setState({mapLayers},() => {
        let tileLayerEndpoint = buildTileFetchEndpoint(this.state.mapTime, this.state.mapLayers[layerID]);
        leafletLayer.setUrl(tileLayerEndpoint);
      });
    } else {
      // TODO: for restoring defaults
    }
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
            overlayPriority: layerObj['overlayPriority'],
            endPoint: layerObj['endPoint'],
            endPointInfo: layerObj['endPointInfo'],
            legendUrl: layerObj['legendUrl'],
            rasterProps: layerObj['rasterProps'] ? {...layerObj['rasterProps']} : null
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
        {this.state.chartModalOpen && 
          <ChartModal
            {...this.state}
            closeChartModal={this.handleCloseChartModal}
          />
        }
        <PersistentDrawerLeft 
          handleLayerToggle = {this.handleLayerToggle}
          handleLevelChange = {this.handleLevelChange}
          handleTimeChange = {this.handleTimeChange}
          handleSettingsPanelVisibility = {this.handleSettingsPanelVisibility}
          {...this.state}
        />
        <div ref={this._mapNode} id="map" className={classNames(classes.map)} />
        <CoordinateDisplay lat={this.state.cursorLat} lng={this.state.cursorLng} />
        {this.state.settingsPanelOpen && 
          <SettingsPanel
            activeSettingsLayer = {this.state.mapLayers[this.state.activeSettingsLayer]}
            handleSettingsPanelHide = {this.handleSettingsPanelHide}
            handleLayerOpacityUpdate = {this.handleLayerOpacityUpdate}
            handleLayerSettingsUpdate = {this.handleLayerSettingsUpdate}
        />
      }
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

