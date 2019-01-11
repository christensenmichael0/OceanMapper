export const buildActiveDrillingPopupContent = (drillingInfo) => {

  let popupContent = `
    <p style="font-size: 1.1em; margin: 3px"><b>${drillingInfo['rig_name']}</b> (${drillingInfo['block']})</p>
    <hr style="margin: 1px">
    <p style="margin: 5px 0 3px">Prospect Name: ${drillingInfo['prospect_name']}</p>
    <p style="margin: 0 0 3px">Well Target Lease: ${drillingInfo['well_target_lease']}</p>
    <p style="margin: 0 0 3px">Water Depth: ${drillingInfo['water_depth']}</p>
    <hr style="margin: 1px">
    <p><i class="fas fa-plus-circle" style="margin-right:3px" ></i><a href="#" data-chart-type="timeseries" onclick="mymap.fire('chartClick')">Plot Timeseries</a></p>
    <p><i class="fas fa-plus-circle" style="margin-right:3px"></i><a href="#" data-chart-type="profile" onclick="mymap.fire('chartClick')>Plot Profile</a></p>
  `
  return popupContent;
}
