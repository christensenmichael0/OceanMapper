import moment from 'moment';
import { getTimeSeriesData, getProfileData } from './dataFetchingUtils';

const compareObj = (a,b) => {
  if (a.x < b.x)
    return -1;
  if (a.x > b.x)
    return 1;
  return 0;
}

const compareArr = (a,b) => {
  if (a[0] < b[0])
    return -1;
  if (a[0] > b[0])
    return 1;
  return 0;
}

export const parseData = (app, chartType, abortSignal) => {
  let mapLayers = app.state.mapLayers, orderedMapLayers = app.state.orderedMapLayers,
  activeLocation = app.state.activeLocation, data, fetchArray = [],
  activeLayers = [], arrowLen = 150;

  orderedMapLayers.forEach(layer => {
    if (mapLayers[layer]['dataset'] && mapLayers[layer]['isOn']) activeLayers.push(mapLayers[layer]);
  })

  // stop execution if no active layers
  if (!activeLayers.length) {
    // TODO: return something so a modal can be displayed
    app.setState({chartLoading: false, chartModalOpen: false});
    return
  }

  // fetch data for each active layer
  activeLayers.forEach(activeLayer => {
    if (chartType === 'timeseries') {
      data = getTimeSeriesData(activeLayer['dataset'],activeLayer['subResource'],
        activeLayer['level'],app.state.startTime, app.state.endTime, 
        [activeLocation['lng'], activeLocation['lat']], abortSignal);
    } else {
      data = getProfileData(activeLayer['dataset'],activeLayer['subResource'],
        app.state.mapTime, [activeLocation['lng'], activeLocation['lat']], abortSignal);
    }
    fetchArray.push(data);
  })

  let chartLoadingErrors = [];
  Promise.all(fetchArray).then(responses => {
    let outputHighChartsArray = [], datasetIDs = [], seriesData, vectorData, layerObj;

    responses.forEach((resp,indx) => {
      // skip the following logic if there was an error (so we could end up with empty outputHighChartsArray)
      // can i build an error object? and display error in subtitle??
      if (resp['error']) {
        chartLoadingErrors.push(activeLayers[indx]['niceName']);
        return;
      }

      // build an array of names to determine if a wave data merge is necessary
      datasetIDs.push(activeLayers[indx]['id']);
      let directionConvention = activeLayers[indx]['directionConvention'];

      seriesData = {type: 'line', data: [] };
      vectorData = {type: 'vector', data: [] };
      layerObj = {
        niceName: activeLayers[indx]['niceName'],
        shortName: activeLayers[indx]['shortName'],
        level: activeLayers[indx]['level'] || 'n/a',
        levelUnit: activeLayers[indx]['levelUnit'],
        dataType: activeLayers[indx]['overlayType'],
        validTime: resp['valid_time'] || null,
        units: resp['units'],
        series: []
      };
      // based on chart type parse and package data differently
      let datapointKey, depth, dateTime, value, direction, origDirection, timeOrigin;

      resp['data'].forEach(datapoint => {
        datapointKey = Object.keys(datapoint)[0];
        if (chartType === 'timeseries') {
          dateTime = moment(datapointKey, 'YYYY-MM-DDTHH:mmZ').utc().valueOf();
        } else {
          depth = layerObj['dataType'] === 'ocean' ? -1 * parseInt(datapointKey) : 
            parseInt(datapointKey);
          // TODO: need to update backend to return datetime
        }
        
        value = datapoint[datapointKey]['val'];
        timeOrigin = datapoint[datapointKey]['time_origin'];

        if (activeLayers[indx]['chartType'] === 'series-vector') {
          // original direction already accounts for to/from standards for winds/waves/currents
          origDirection = datapoint[datapointKey]['direction'];
          // add 180 degrees if working with certain datasets so arrow displays correctly in charts
          direction = directionConvention === 'from' ? datapoint[datapointKey]['direction'] : 
            (datapoint[datapointKey]['direction'] + 180) % 360;

          // axis is inverted when working with profile plots.. this fudges the direction so its 
          // represented properly
          direction = chartType === 'timeseries' ? direction : (90 - direction) % 360;

          seriesData['data'].push({
            x: chartType === 'timeseries' ? dateTime : depth, 
            y: value, 
            direction: origDirection, 
            timeOrigin});
          
          vectorData['data'].push([chartType === 'timeseries' ? dateTime : depth, value, arrowLen, direction]);

        } else if (activeLayers[indx]['chartType'] === 'vector') {
          direction = directionConvention === 'from' ? value : 
          (value + 180) % 360;

          // axis is inverted when working with profile plots.. this fudges the direction so its 
          // represented properly
          direction = chartType === 'timeseries' ? direction : (90 - direction) % 360;

          // vector gets plot at a constant y value of 1
          vectorData['data'].push([chartType === 'timeseries' ? dateTime : depth, 1, arrowLen, direction]);
        } else {
          seriesData['data'].push({x: chartType === 'timeseries' ? dateTime : depth, y: value, timeOrigin});
        }
      })

      // only push non empty data arrays to output array to be shipped to highcharts component
      let comboSeries = [seriesData, vectorData];
      comboSeries.forEach(dataObj => {
        if (dataObj['data'].length > 0) {
          layerObj['series'].push(dataObj)
        }
      })
      // push object into output array
      outputHighChartsArray.push(layerObj);
    })
    // merge wave height and direction at this point if both exist in outputHighChartsArray
    if (datasetIDs.includes('ww3_sig_wave_height') & datasetIDs.includes('ww3_primary_wave_dir')) {
      var waveHeightIndx  = datasetIDs.indexOf('ww3_sig_wave_height');
      var waveDirIndx = datasetIDs.indexOf('ww3_primary_wave_dir');
      
      // note that modifying waveHeightArr in forEach loop below modifies outputHighChartsArray
      let waveHeightArr = outputHighChartsArray[waveHeightIndx].series[0].data.slice();
    
      let waveDirectionObj = {};
      // create an object with forecast times as keys and direction as values
      outputHighChartsArray[waveDirIndx].series[0].data.forEach(el => {
        waveDirectionObj[el[0]] = el[3];
      })

      // empty vector data before adding new data
      vectorData['data'] = [];
      outputHighChartsArray[waveHeightIndx].series.push(vectorData)

      // for each wave height entry see if corresponding data exists for wave direction
      // and add it to the vector series if it does
      waveHeightArr.forEach((waveHeightData,arrIndx) => {
        let xval = waveHeightData['x'];
        let val = waveHeightData['y'];

        if (waveDirectionObj[xval]) {
          outputHighChartsArray[waveHeightIndx].series[1].data.push(
            [xval, val, arrowLen, waveDirectionObj[xval]])

          // updates outputHighChartsArray to include direction property alongside wave height
          waveHeightData['direction'] = waveDirectionObj[xval];
        }
      })

      // remove wave direction from output array since its now combined with wave height
      outputHighChartsArray.splice(waveDirIndx, 1);
    }
    // sort if profile data
    if (chartType === 'profile') {
      outputHighChartsArray.forEach(dataset => {
        dataset['series'].forEach((subDataset, subIndx) => {
          let dataArr = subDataset['data'];
          subIndx === 0 ? dataArr.sort(compareObj) : dataArr.sort(compareArr);
        })
      })
    }
    app.setState({chartLoading: false, chartData: outputHighChartsArray, chartLoadingErrors});
  })
}