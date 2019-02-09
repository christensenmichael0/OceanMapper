import { formatDateTime } from './formatDateTime';

const imageTypeLayers = ['getLeaseAreas', 'getLeaseBlocks', 'getTropicalActivity'];
const tileTypeLayers = ['getModelField', 'getGebcoBathy'];

/**
 * Function used to cancel a loading layer (in pending state)
 *
 * @param {str} layerID the layer id
 * @param {object} app the App.js component
 * @param {object} L leaflet base object
 */
export const abortLayerRequest = (layerID, app, L) => {
  let mapLayers = Object.assign({}, app.state.mapLayers)
  let lid = app.layerBindings[layerID];
  let leafletLayer = app.leafletLayerGroup.getLayer(lid);
  
  // image layer abort
  if (imageTypeLayers.indexOf(mapLayers[layerID]['addDataFunc']) > -1) {
    try {
      leafletLayer._image.src = L.Util.emptyImageUrl;
    } catch (err) {
      console.log('image abort already complete!');
    }
  }

  // tile layer abort
  if (tileTypeLayers.indexOf(mapLayers[layerID]['addDataFunc']) > -1) {
    try {
      leafletLayer._abortLoading();
    } catch (err) {
      console.log('tile layer abort already complete!');
    }
  }
}

export const getPointData = (dataset, subResource, level, time, coordinates) => {
  let formattedTime = `${formatDateTime(time, 'YYYY-MM-DDTHH:mm', '')}Z`;
  let formattedCoords = coordinates.toString();
  let levelStr = isNaN(level) ? 'level=' : `level=${level}`;
  let endpoint = `/data/point-data?${levelStr}&dataset=${dataset}&sub_resource=${subResource}&time=${formattedTime}&coordinates=${formattedCoords}`;
  return getData(endpoint);
}

export const getTimeSeriesData = (dataset, subResource, level, startTime, endTime, coordinates) => {
  let formattedStartTime = `${formatDateTime(startTime, 'YYYY-MM-DDTHH:mm', '')}Z`;
  let formattedEndTime = `${formatDateTime(endTime, 'YYYY-MM-DDTHH:mm', '')}Z`;
  let formattedCoords = coordinates.toString();
  let levelStr = isNaN(level) ? 'level=' : `level=${level}`;
  let endpoint = `/data/timeseries-data?${levelStr}&dataset=${dataset}&sub_resource=${subResource}&start_time=${formattedStartTime}&end_time=${formattedEndTime}&coordinates=${formattedCoords}`
  return getData(endpoint);
}

export const getModelField = (dataset, subResource, level, time) => {
  let formattedTime = `${formatDateTime(time, 'YYYY-MM-DDTHH:mm', '')}Z`;
  let levelStr = isNaN(level) ? 'level=' : `level=${level}`;
  let endpoint = `/data/individual-field?dataset=${dataset}&sub_resource=${subResource}&${levelStr}&time=${formattedTime}`;
  return getData(endpoint);
}

// https://developers.google.com/web/fundamentals/primers/async-functions
// use this to simplify other request... pass in enpoint as an argument
export const getData = async (endpoint, respType='json') => {
  // let endpoint = '/data/individual-field?level=0&time=2018-12-15T02:00Z&sub_resource=ocean_current_speed&dataset=HYCOM_DATA'
  try {
    const response = await fetch(endpoint); // sends request
    if (response.ok) {
      const output = respType === 'json' ? await response.json() : await response.text();
      // code to execute with jsonResponse
      return output
    }
    throw new Error('Request Failed!');
  } catch (error) {
    return {error};
  }
}
