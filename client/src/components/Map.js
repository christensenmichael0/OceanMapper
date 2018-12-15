import React, { Component } from 'react';
import deepEqual from 'deep-equal';


// store the map configuration properties in an object,
// we could also move this to a separate file & import it if desired.
let config = {};
config.params = {
  center: [25.8,-89.6],
  zoom: 6,
  maxZoom: 14,
  minZoom: 3,
  zoomControl: false,
  attributionControl: false
};
// config.tileLayer = {
//   uri: 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
//   params: {
//     minZoom: 11,
//     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
//     id: '',
//     accessToken: ''
//   }
// };

// array to store unique names of Brooklyn subway lines,
// this eventually gets passed down to the Filter component
// let subwayLineNames = [];

// https://gis.stackexchange.com/questions/183720/does-leaflet-support-user-defined-layer-identifiers

// var layer = L.tileLayer('foo');
// var group = L.layerGroup([layer]);
// var id = group.getLayerId(layer);
// ...
// group.getLayer(id);


// L.LayerGroup.include({
//     customGetLayer: function (id) {
//         for (var i in this._layers) {
//             if (this._layers[i].id == id) {
//                 return this._layers[i];
//             }
//         }
//     }
// });

class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // map: null,
      mapTime: null,
      mapLayers: null,
      leafletLayers: null,
      tileLayer: null,
      geojsonLayer: null,
      geojson: null,
    };

    // move mapTime and mapLayers onto this instead of keeping in state

    this._mapNode = null;
    this.updateMap = this.updateMap.bind(this);
    this.determineLayerDiff = this.determineLayerDiff.bind(this);
    this.addTestLayer = this.addTestLayer.bind(this);

    this.onEachFeature = this.onEachFeature.bind(this);
    this.pointToLayer = this.pointToLayer.bind(this);
    this.filterFeatures = this.filterFeatures.bind(this);
    this.filterGeoJSONLayer = this.filterGeoJSONLayer.bind(this);
  }

  determineLayerDiff(mapLayers, parentLayers) {
    // check for time change first (Map.js mapTime vs prevProps mapTime... make use of timeSensitive prop to only update those layers that are time
    // sensitive if nothing else is different

    // loop through prevProps.mapLayers and compare to prevState..
    // if prev state is empty then immediatelly return prevProps.mapLayers
    // if not return the array of objects to trigger actions for
    
    let layerUpdates = [], layerIndx, layerName, previousLayerProps, isEqual;
    if (!this.mapTime) {
      for (layerIndx=0; layerIndx<parentLayers['orderedMapLayers'].length; layerIndx++) {
        layerName = parentLayers['orderedMapLayers'][layerIndx];
        previousLayerProps = parentLayers['mapLayers'][layerName];
        layerUpdates.push({id: layerName,...previousLayerProps})
      }

      return layerUpdates

    } else if (this.state.mapTime !== parentLayers['mapTime']) {
      // loop through all timesensitive layers and call functions to remove/readd layer based on new time
      console.log('time changed');
      return [];
    } else {
      // loop through all layers to see if anything is different between parent and map class
      for (layerIndx=0; layerIndx<parentLayers['orderedMapLayers'].length; layerIndx++) {
        // debugger
        layerName = parentLayers['orderedMapLayers'][layerIndx];
        previousLayerProps = parentLayers['mapLayers'][layerName];
        isEqual = deepEqual(previousLayerProps,this.mapLayers[layerName])
        debugger
        if (!isEqual) {
          console.log('bang!');
          layerUpdates.push(previousLayerProps)
        }
      }
      
      return layerUpdates;
    }
  }

  componentDidMount() {
    // code to run just after the component "mounts" / DOM elements are created
    // we could make an AJAX request for the GeoJSON data here if it wasn't stored locally
    // this.getData();
    
    // if (!this.state.map) {
    if (!this.map) {
      // create the Leaflet map object
      this.inititialize_map(this._mapNode);
      // TODO: make some api calls for data 
    }
  }

  // componentWillReceiveProps(nextProps) {
  //   console.log('rec props')
  //   // debugger
  // }

  // componentDidUpdate(prevProps, prevState) {
  //   let layerUpdates;
  //   // debugger
  //   if (prevProps.initializedLayers) {
  //     // debugger
  //     layerUpdates = this.determineLayerDiff(prevProps);
  //     // take care not to go into infinite loop... only call setState if there are updates to be made
  //     // trigger functions for objects in layerDif['updatedMapLayers']
  //     //debugger
  //     if (layerUpdates.length) {
  //       // debugger
  //       // trigger layer updates... loop through and call the layers respective update function
  //       layerUpdates.forEach((layerObj) => {
  //         this.addTestLayer(layerObj);
  //       });

  //       // this.setState({mapTime: prevProps['mapTime'], mapLayers: prevProps['mapLayers']})
  //       //debugger
  //       console.log('got past state change');
  //       // set properties instead of setting state
  //       // this.mapTime = prevProps['mapTime'];
  //       // this.mapLayers = prevProps['mapLayers'];
  //     }
  //   }
  //   //debugger
  //   console.log('hi');
  // }

  addTestLayer(layerObj) {
    // marker2=L.marker([0,10],{pane: 'test'})
    console.log('layer being added');
    let L = window.L;

    let rand_lat = Math.floor(Math.random() * 11); 
    let marker=L.marker([rand_lat,0]).bindPopup(layerObj['id']);

    marker.addTo(this.map);
    this.layerGroup.addLayer(marker)
  }

    

    // code to run when the component receives new props or state
    // check to see if geojson is stored, map is created, and geojson overlay needs to be added
    // if (this.state.geojson && this.state.map && !this.state.geojsonLayer) {
    //   // add the geojson overlay
    //   this.addGeoJSONLayer(this.state.geojson);
    // }

    // // check to see if the subway lines filter has changed
    // if (this.state.subwayLinesFilter !== prevState.subwayLinesFilter) {
    //   // filter / re-render the geojson overlay
    //   this.filterGeoJSONLayer();
    // }
  //}

  componentWillMount() {
    // code to run just before rendering the component
    // this destroys the Leaflet map object & related event listeners
  }

  componentWillUnmount() {
    // code to run just before unmounting the component
    // this destroys the Leaflet map object & related event listeners
    // this.state.map.remove();
  }

  getData() {
    // could also be an AJAX request that results in setting state with the geojson data
    // for simplicity sake we are just importing the geojson data using webpack's json loader
    // this.setState({
    //   numEntrances: geojson.features.length,
    //   geojson
    // });
  }


  addGeoJSONLayer(geojson) {
    // create a native Leaflet GeoJSON SVG Layer to add as an interactive overlay to the map
    // an options object is passed to define functions for customizing the layer
    // const geojsonLayer = L.geoJson(geojson, {
    //   onEachFeature: this.onEachFeature,
    //   pointToLayer: this.pointToLayer,
    //   filter: this.filterFeatures
    // });
    // // add our GeoJSON layer to the Leaflet map object
    // geojsonLayer.addTo(this.state.map);
    // // store the Leaflet GeoJSON layer in our component state for use later
    // this.setState({ geojsonLayer });
    // // fit the geographic extent of the GeoJSON layer within the map's bounds / viewport
    // this.zoomToFeature(geojsonLayer);
  }

  filterGeoJSONLayer() {
    // clear the geojson layer of its data
    // this.state.geojsonLayer.clearLayers();
    // // re-add the geojson so that it filters out subway lines which do not match state.filter
    // this.state.geojsonLayer.addData(geojson);
    // // fit the map to the new geojson layer's geographic extent
    // this.zoomToFeature(this.state.geojsonLayer);
  }

  zoomToFeature(target) {
    // pad fitBounds() so features aren't hidden under the Filter UI element
    // var fitBoundsParams = {
    //   paddingTopLeft: [200,10],
    //   paddingBottomRight: [10,10]
    // };
    // // set the map's center & zoom so that it fits the geographic extent of the layer
    // this.state.map.fitBounds(target.getBounds(), fitBoundsParams);
  }

  filterFeatures(feature, layer) {
    // filter the subway entrances based on the map's current search filter
    // returns true only if the filter value matches the value of feature.properties.LINE
    // const test = feature.properties.LINE.split('-').indexOf(this.state.subwayLinesFilter);
    // if (this.state.subwayLinesFilter === '*' || test !== -1) {
    //   return true;
    // }
  }

  pointToLayer(feature, latlng) {
    // renders our GeoJSON points as circle markers, rather than Leaflet's default image markers
    // parameters to style the GeoJSON markers
    // var markerParams = {
    //   radius: 4,
    //   fillColor: 'orange',
    //   color: '#fff',
    //   weight: 1,
    //   opacity: 0.5,
    //   fillOpacity: 0.8
    // };

    // return L.circleMarker(latlng, markerParams);
  }

  onEachFeature(feature, layer) {
    // if (feature.properties && feature.properties.NAME && feature.properties.LINE) {

    //   // if the array for unique subway line names has not been made, create it
    //   // there are 19 unique names total
    //   if (subwayLineNames.length < 19) {

    //     // add subway line name if it doesn't yet exist in the array
    //     feature.properties.LINE.split('-').forEach(function(line, index){
    //       if (subwayLineNames.indexOf(line) === -1) subwayLineNames.push(line);
    //     });

    //     // on the last GeoJSON feature
    //     if (this.state.geojson.features.indexOf(feature) === this.state.numEntrances - 1) {
    //       // use sort() to put our values in alphanumeric order
    //       subwayLineNames.sort();
    //       // finally add a value to represent all of the subway lines
    //       subwayLineNames.unshift('All lines');
    //     }
    //   }

    //   // assemble the HTML for the markers' popups (Leaflet's bindPopup method doesn't accept React JSX)
    //   const popupContent = `<h3>${feature.properties.NAME}</h3>
    //     <strong>Access to MTA lines: </strong>${feature.properties.LINE}`;

    //   // add our popups
    //   layer.bindPopup(popupContent);
    // }
  }

  inititialize_map(id) {
    // if (this.state.map) return;
    if (this.map) return;

    // this function creates the Leaflet map object and is called after the Map component mounts
    let L = window.L;
    let map = this.map = L.map(id, config.params);
    L.esri.basemapLayer("DarkGray").addTo(map);

    // zoom control position
    L.control.zoom({
         position:'topright'
    }).addTo(map);

    // add an empty layer group to the map
    this.layerGroup = L.layerGroup([]);
    this.layerGroup.addTo(map);

    // set our map state 
    // this.setState({ map });

  }

  updateMap() {
    // TODO continue on this path.. render calls this function which triggers necessary DOM actions
    let layerUpdates;
    if (this.props.initializedLayers) {
      debugger
      layerUpdates = this.determineLayerDiff(this.mapLayers, this.props);

      if (layerUpdates.length) {
        // debugger
        // trigger layer updates... loop through and call the layers respective update function
        layerUpdates.forEach((layerObj) => {
          this.addTestLayer(layerObj);
        });

        // set properties instead of setting state
        this.mapTime = this.props.mapTime;
        this.mapLayers = Object.assign({},this.props.mapLayers);
      }
    }
  }

  render() {
    // TODO: include function to update layers here... use determine diff function which can then call another function
    // to manipulate DOM.. we don't need componentDidUpdate.. componentWillRecieveProps.. (THIS ISNT WORKING)

    // PASS THE DIEFFERENCE ARRAY FROM THE PARENT... that can be saved in the parent state... it gets generated whenever
    // a layer is toggled, level is changed, or time is changed... still need a function here to do DOM manipulation

    // IF difference object is empty then need to add them all.... rerenders do happen when none of these actions happen.. what to do about that?

    // CAN ALSO add custom info in leaflet layer inside options... could use this to check props.mapLayers vs whats on the map (this might be the way to go)...
    // loop through all items in a layer group... might not need difference... would be good if we can find a layer by its id on the map



    return (
      <div ref={(node) => this._mapNode = node} id="map" />
    )
  }
}

export default Map;
