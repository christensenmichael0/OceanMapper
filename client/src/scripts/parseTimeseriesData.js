import moment from 'moment';
import { getTimeSeriesData } from './dataFetchingUtils';


export const parseTimeseriesData = (app) => {
  let mapLayers = app.state.mapLayers, orderedMapLayers = app.state.orderedMapLayers,
  activeLocation = app.state.activeLocation, timeseriesData, timeseriesFetchArray = [],
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
    timeseriesData = getTimeSeriesData(activeLayer['dataset'],activeLayer['subResource'],
      activeLayer['level'],app.state.startTime, app.state.endTime, 
      [activeLocation['lng'], activeLocation['lat']]);
    timeseriesFetchArray.push(timeseriesData);
  })

  Promise.all(timeseriesFetchArray).then(responses => {
    let outputHighChartsArray = [], datasetIDs = [], seriesData, vectorData, layerObj;
    
    responses.forEach((resp,indx) => {
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
        units: resp['units'],
        series: []
      };
      // based on chart type parse and package data differently
      let datapointKey, dateTime, value, direction, timeOrigin;

      resp['data'].forEach(datapoint => {
        datapointKey = Object.keys(datapoint)[0];
        dateTime = moment(datapointKey, 'YYYY-MM-DDTHH:mmZ').utc().valueOf();
        value = datapoint[datapointKey]['val'];
        timeOrigin = datapoint[datapointKey]['time_origin'];

        if (activeLayers[indx]['chartType'] === 'series-vector') {
          // add 180 degrees if working with certain datasets so arrow displays
          // correctly in charts
          direction = directionConvention === 'from' ? datapoint[datapointKey]['direction'] : 
            (datapoint[datapointKey]['direction'] + 180) % 360;

          seriesData['data'].push({x: dateTime, y: value, direction, timeOrigin});
          vectorData['data'].push([dateTime, value, arrowLen, direction])

        } else if (activeLayers[indx]['chartType'] === 'vector') {
          direction = directionConvention === 'from' ? value : 
          (value + 180) % 360;

          // vector gets plot at a constant y value of 1
          vectorData['data'].push([dateTime, 1, arrowLen, direction]);
        } else {
          seriesData['data'].push({x: dateTime, y: value, timeOrigin});
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
    
      let waveDirectionDateTimes = {};
      // create an object with forecast times as keys and direction as values
      outputHighChartsArray[waveDirIndx].series[0].data.forEach(el => {
        // waveDirectionDateTimes[el[0].format()] = el[3];
        waveDirectionDateTimes[el[0]] = el[3];
      })

      // empty vector data before adding new data
      vectorData['data'] = [];
      outputHighChartsArray[waveHeightIndx].series.push(vectorData)

      // for each wave height entry see if corresponding data exists for wave direction
      // and add it to the vector series if it does
      waveHeightArr.forEach((waveHeightData,arrIndx) => {
        let dt = waveHeightData['x'];
        let val = waveHeightData['y'];

        if (waveDirectionDateTimes[dt]) {
          outputHighChartsArray[waveHeightIndx].series[1].data.push(
            [dt, val, arrowLen, waveDirectionDateTimes[dt]])

          // updates outputHighChartsArray to include direction property alongside wave height
          waveHeightData['direction'] = waveDirectionDateTimes[dt];
        }
      })

      // remove wave direction from output array since its now combined with wave height
      outputHighChartsArray.splice(waveDirIndx, 1);
    }
    app.setState({chartLoading: false, chartData: outputHighChartsArray});
  })
}