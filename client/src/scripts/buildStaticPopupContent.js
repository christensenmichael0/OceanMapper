// import buttonTextSize from './styleVariables';

export const activeDrillingPopupStaticContent = drillingInfo => {

  let popupContent = `
    <p class="rig-name-header"><b>${drillingInfo['rig_name']}</b> (${drillingInfo['block']})</p>
    <hr style="margin: 1px">
    <p class="active-drilling-info">Prospect Name: ${drillingInfo['prospect_name']}</p>
    <p class="active-drilling-info">Well Target Lease: ${drillingInfo['well_target_lease']}</p>
    <p class="active-drilling-info">Water Depth: ${drillingInfo['water_depth']}</p>
  `
  return popupContent;
}

export const customLocationPopupStaticContent = coords => {
  let popupContent = `
    <p class="rig-name-header"><b>Custom Location</b></p>
    <hr style="margin: 1px">
    <p class="active-drilling-info">Latitude: ${coords['lat'].toFixed(4)}</p>
    <p class="active-drilling-info">Longitude: ${coords['lng'].toFixed(4)}</p>
  `

  return popupContent;
}

export const buildActiveDrillingPopupButtons  = () => {
  
  let buttonContent = `
  <hr style="margin: 1px">
  <p><i class="fas fa-plus-circle popup-button"></i><a class="popup-button-text" href="#" data-chart-type="timeseries" onclick="mymap.fire('timeseriesClick')">Plot Timeseries</a></p>
  <p><i class="fas fa-plus-circle popup-button"></i><a class="popup-button-text" href="#" data-chart-type="profile" onclick="mymap.fire('profileClick')">Plot Profile</a></p>
  `
  return buttonContent
}
