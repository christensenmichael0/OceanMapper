import { formatDateTime } from './formatDateTime';
import { imageLayers, tileLayers, dataLayers } from './layers';

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
  if (imageLayers.indexOf(mapLayers[layerID]['addDataFunc']) > -1) {
    try {
      leafletLayer._image.src = L.Util.emptyImageUrl;
    } catch (err) {
      console.log('image layer abort already complete!');
    }
  }

  // tile layer abort
  if (tileLayers.indexOf(mapLayers[layerID]['addDataFunc']) > -1) {
    try {
      leafletLayer._abortLoading();
    } catch (err) {
      console.log('tile layer abort already complete!');
    }
  }

  if (dataLayers.indexOf(mapLayers[layerID]['addDataFunc']) > -1) { 
    try {
      let abortController = mapLayers[layerID]['abortController'];
      abortController.abort();
    } catch (err) {
      console.log('data layer abort already complete!');
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

export const getTimeSeriesData = (dataset, subResource, level, startTime, endTime, coordinates, abortSignal=null) => {
  let formattedStartTime = `${formatDateTime(startTime, 'YYYY-MM-DDTHH:mm', '')}Z`;
  let formattedEndTime = `${formatDateTime(endTime, 'YYYY-MM-DDTHH:mm', '')}Z`;
  let formattedCoords = coordinates.toString();
  let levelStr = isNaN(level) ? 'level=' : `level=${level}`;
  let endpoint = `/data/timeseries-data?${levelStr}&dataset=${dataset}&sub_resource=${subResource}&start_time=${formattedStartTime}&end_time=${formattedEndTime}&coordinates=${formattedCoords}`
  return getData(endpoint, 'json', abortSignal);
}

export const getProfileData = (dataset, subResource, time, coordinates, abortSignal=null) => {
  let formattedTime = `${formatDateTime(time, 'YYYY-MM-DDTHH:mm', '')}Z`;
  let formattedCoords = coordinates.toString();
  let endpoint = `/data/profile-data?dataset=${dataset}&sub_resource=${subResource}&time=${formattedTime}&coordinates=${formattedCoords}`
  return getData(endpoint, 'json', abortSignal);
}

export const getModelField = (dataset, subResource, level, time, abortSignal=null) => {
  let formattedTime = `${formatDateTime(time, 'YYYY-MM-DDTHH:mm', '')}Z`;
  let levelStr = isNaN(level) ? 'level=' : `level=${level}`;
  let endpoint = `/data/individual-field?dataset=${dataset}&sub_resource=${subResource}&${levelStr}&time=${formattedTime}`;
  return getData(endpoint, 'json', abortSignal);
}

// https://developers.google.com/web/fundamentals/primers/async-functions
// use this to simplify other request... pass in enpoint as an argument
export const getData = async (endpoint, respType='json', signal=null) => {
  try {
    const response = await fetch(endpoint, { signal }); // sends request
    if (response.ok) {
      const output = respType === 'json' ? await response.json() : await response.text();
      // code to execute with jsonResponse
      return output
    }
    throw new Error('Request Failed!');
  } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        console.error('Error occurred!', error);
      }
    return {error};
  }
}
