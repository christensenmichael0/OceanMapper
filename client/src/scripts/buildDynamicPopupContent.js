import { buildActiveDrillingPopupButtons } from './buildStaticPopupContent';
import { getPointData } from './dataFetchingUtils';

export const buildDynamicPopupContent = (getAppState, markerContext) => {
  let mapLayers = getAppState()['mapLayers'];
  let orderedMapLayers = getAppState()['orderedMapLayers'];

  let activeLayers = [];
  orderedMapLayers.forEach(layer => {
    if (mapLayers[layer]['dataset'] && mapLayers[layer]['isOn']) activeLayers.push(mapLayers[layer]);
  })

  let origPopupContent = markerContext.popup._source.options.popupStationContent;
  let modelOutputContent = '<hr style="margin: 1px">';
  let buttonContent = buildActiveDrillingPopupButtons();

  if (activeLayers.length) {
    let dataContent = `<span>Fetching Model Output<div class="loader loader-popup small"></div><span>`;
    markerContext.popup.setContent(`${origPopupContent}${dataContent}${buttonContent}`)
    
    let pointData, pointFetchArray = [];
    let markerCoords = markerContext.popup._source.options.coordinates.slice().reverse();
    
    // fetch data for each active layer
    activeLayers.forEach(activeLayer => {
      pointData = getPointData(activeLayer['dataset'],activeLayer['subResource'],
        activeLayer['level'],getAppState()['mapTime'], markerCoords);
      pointFetchArray.push(pointData);
    })
    
    // promises are returned in the same order as the input
    Promise.all(pointFetchArray).then(responses => {
      responses.forEach((resp,indx) => {
        // TODO: deal with errors and fix naming of dataset
        // TODO: move some of this building logic to an external func
        let niceName = activeLayers[indx]['niceName'];

        let value = resp['data']['val'].toFixed(2);
        let direction = resp['data']['direction'] ? resp['data']['direction'].toFixed(1) : null;
        let units = resp['units'];

        let dataStr;
        if (direction) {
          dataStr = `<p style='margin: 5px 0px'>${niceName}: ${value} ${units} @ ${direction} deg</p>`;
        } else {
          dataStr = `<p style='margin: 5px 0px'>${niceName}: ${value} ${units}</p>`;
        }
        modelOutputContent += dataStr;
      });
      // update popup content
      markerContext.popup.setContent(
        `${origPopupContent}${modelOutputContent}${buttonContent}`
      )
    }) 
  }
}