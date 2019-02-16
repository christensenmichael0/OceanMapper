import moment from 'moment';
import { getProfileData } from './dataFetchingUtils';


export const parseProfileData = (app, abortSignal) => {
  let mapLayers = app.state.mapLayers, orderedMapLayers = app.state.orderedMapLayers,
  activeLocation = app.state.activeLocation, profileData, profileFetchArray = [],
  activeLayers = [], arrowLen = 150;

  orderedMapLayers.forEach(layer => {
    if (mapLayers[layer]['dataset'] && mapLayers[layer]['isOn']) activeLayers.push(mapLayers[layer]);
  })

  // stop execution if no active layers
  if (!activeLayers.length) { 
    app.setState({chartLoading: false});
    return
  }

  // fetch data for each active layer
  activeLayers.forEach(activeLayer => {
    profileData = getProfileData(activeLayer['dataset'],activeLayer['subResource'],
      app.state.mapTime, [activeLocation['lng'], activeLocation['lat']], abortSignal);
    profileFetchArray.push(profileData);
  })

  let chartLoadingErrors = [];
  Promise.all(profileFetchArray).then(responses => {
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
        levelUnit: activeLayers[indx]['levelUnit'],
        units: resp['units'],
        series: []
      };
      // based on chart type parse and package data differently
      let datapointKey, dateTime, depth, value, direction, origDirection, timeOrigin;

      resp['data'].forEach(datapoint => {
        datapointKey = Object.keys(datapoint)[0];
        depth = parseInt(datapointKey);
        // no datetime is returned might need to fix that
        // dateTime = moment(datapointKey, 'YYYY-MM-DDTHH:mmZ').utc().valueOf(); 
        value = datapoint[datapointKey]['val'];
        timeOrigin = datapoint[datapointKey]['time_origin'];

        if (activeLayers[indx]['chartType'] === 'series-vector') {
          // original direction already accounts for to/from standards for winds/waves/currents
          origDirection = datapoint[datapointKey]['direction'];
          // add 180 degrees if working with certain datasets so arrow displays correctly in charts
          direction = directionConvention === 'from' ? datapoint[datapointKey]['direction'] : 
            (datapoint[datapointKey]['direction'] + 180) % 360;

          seriesData['data'].push({x: depth, y: value, direction: origDirection, timeOrigin});
          vectorData['data'].push([depth, value, arrowLen, direction])

        } else if (activeLayers[indx]['chartType'] === 'vector') {
          direction = directionConvention === 'from' ? value : 
          (value + 180) % 360;

          // vector gets plot at a constant y value of 1
          vectorData['data'].push([depth, 1, arrowLen, direction]);
        } else {
          seriesData['data'].push({x: depth, y: value, timeOrigin});
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
        let dpth = waveHeightData['x'];
        let val = waveHeightData['y'];

        if (waveDirectionObj[dpth]) {
          outputHighChartsArray[waveHeightIndx].series[1].data.push(
            [dpth, val, arrowLen, waveDirectionObj[dpth]])

          // updates outputHighChartsArray to include direction property alongside wave height
          waveHeightData['direction'] = waveDirectionObj[dpth];
        }
      })

      // remove wave direction from output array since its now combined with wave height
      outputHighChartsArray.splice(waveDirIndx, 1);
    }

    // TODO: need to sort the arrays by depth
    app.setState({chartLoading: false, chartData: outputHighChartsArray, chartLoadingErrors});
  })
}