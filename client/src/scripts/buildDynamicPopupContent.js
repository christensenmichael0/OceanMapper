import {buildActiveDrillingPopupButtons} from './buildStaticPopupContent';
import {getPointData} from './dataFetchingUtils';

export const buildDynamicPopupContent = (getAppState, markerContext) => {
  let mapLayers = getAppState()['mapLayers'];
  let orderedMapLayers = getAppState()['orderedMapLayers'];

  let activeLayers = [];
  orderedMapLayers.forEach(layer => {
    if (mapLayers[layer] && mapLayers[layer]['dataset'] && mapLayers[layer]['isOn']) activeLayers.push(mapLayers[layer]);
  })

  let origPopupContent = markerContext.popup._source.options.popupStationContent || 
    `<p class="rig-name-header"><b>Custom Location</b></p>`;

  let modelOutputContent = '<hr style="margin: 1px">';
  let buttonContent = buildActiveDrillingPopupButtons();

  if (activeLayers.length) {
    let fetchingHTML = `<span class="default-popup-text">Fetching Model Output<div class="loader loader-popup small"></div><span>`;
    let dataContent = `${modelOutputContent}${fetchingHTML}`;
    markerContext.popup.setContent(`${origPopupContent}${dataContent}${buttonContent}`)
    
    let pointData, pointFetchArray = [];
    
    let markerCoords = [markerContext.sourceTarget._latlng['lng'], markerContext.sourceTarget._latlng['lat']];
    
    // fetch data for each active layer
    activeLayers.forEach(activeLayer => {
      pointData = getPointData(activeLayer['dataset'],activeLayer['subResource'],
        activeLayer['level'],getAppState()['mapTime'], markerCoords);
      pointFetchArray.push(pointData);
    })
    
    // promises are returned in the same order as the input
    Promise.all(pointFetchArray).then(responses => {
      responses.forEach((resp,indx) => {

        let niceName = activeLayers[indx]['niceName'];
        let value, direction, units, dataStr;
        if (!resp['error'] && resp.data) {
          value = resp['data']['val'].toFixed(2);
          direction = resp['data']['direction'] ? resp['data']['direction'].toFixed(1) : null;
          units = resp['units'];
          // build dataStr
          if (direction) {
            dataStr = `<p class="popup-metoc-data">${niceName}: ${value} ${units} @ ${direction}°</p>`;
          } else {
            dataStr = `<p class="popup-metoc-data">${niceName}: ${value} ${units}</p>`;
          }
        } else if (!resp['data'] && resp['status'] === "point on land") {
          dataStr = `<p class="popup-metoc-data">${niceName}: data unavailable</p>`;
        } else {
          dataStr = `<p class="popup-metoc-data">${niceName}: failed to load data!</p>`;
        }

        modelOutputContent += dataStr;
      });
      // update popup content
      markerContext.popup.setContent(
        `${origPopupContent}${modelOutputContent}${buttonContent}`
      )
    }).catch(error => {
      console.log(error);
    })
  }
}
