export const activeDrillingPopupStaticContent = (drillingInfo) => {

  let popupContent = `
    <p style="font-size: 1.3em; margin: 10px"><b>${drillingInfo['rig_name']}</b> (${drillingInfo['block']})</p>
    <hr style="margin: 1px">
    <p style="margin: 5px 0 3px; font-size: 1.2em">Prospect Name: ${drillingInfo['prospect_name']}</p>
    <p style="margin: 0 0 3px; font-size: 1.2em">Well Target Lease: ${drillingInfo['well_target_lease']}</p>
    <p style="margin: 0 0 3px; font-size: 1.2em">Water Depth: ${drillingInfo['water_depth']}</p>
  `
  return popupContent;
}

export const buildActiveDrillingPopupButtons  = () => {
  
  let buttonContent = `
  <hr style="margin: 1px">
  <p><i class="fas fa-plus-circle" style="margin-right:3px" ></i><a style="font-size: 1.2em" href="#" data-chart-type="timeseries" onclick="mymap.fire('timeseriesClick')">Plot Timeseries</a></p>
  <p><i class="fas fa-plus-circle" style="margin-right:3px"></i><a style="font-size: 1.2em" href="#" data-chart-type="profile" onclick="mymap.fire('profileClick')">Plot Profile</a></p>
  `
  return buttonContent
}
