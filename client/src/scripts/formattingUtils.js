import { formatDateTime } from './formatDateTime';

export const populateImageUrlEndpoint = (urlEndpoint, mapProps) => {
  let layerEndpointUrl = urlEndpoint.replace('#width',mapProps['width']).replace('#height', mapProps['height']).replace(
    '#bbox', `${mapProps['swCorner']['x']},${mapProps['swCorner']['y']},
    ${mapProps['neCorner']['x']},${mapProps['neCorner']['y']}`).replace(/\s+/g, '');

  return layerEndpointUrl;
}

export const buildTileFetchEndpoint = (mapTime, layerObj) => {

    let dataRangeDefined = layerObj['rasterProps']['currentMin'] !== undefined ? true : false;
    // build query paramater object and then prune those keys which have no value
    let queryParams = {
      time: `${formatDateTime(mapTime, 'YYYY-MM-DDTHH:mm', '')}Z`,
      dataset: layerObj['dataset'],
      sub_resource: layerObj['subResource'],
      level: !isNaN(layerObj['level']) ? layerObj['level'].toString() : 'blank',
      color_map: layerObj['rasterProps']['colormap'],
      data_range: dataRangeDefined ? 
        `${layerObj['rasterProps']['currentMin']},${layerObj['rasterProps']['currentMax']}` : undefined,
      interval: layerObj['rasterProps']['interval']
    }

    let param, paramArr = [];
    for (param in queryParams) {
      if (!queryParams[param]) {
        delete queryParams[param]; 
      } else {
        queryParams[param] === 'blank' ? paramArr.push(`${param}=`) :
          paramArr.push(`${param}=${queryParams[param]}`)
      }
    }
    let queryStr = paramArr.join('&');

    // TODO: move this to a more easily editable location
    let apiGatewayEndpoint = 'https://a7vap1k0cl.execute-api.us-east-2.amazonaws.com';

    return `${apiGatewayEndpoint}/staging/dynamic-tile/{z}/{x}/{y}?${queryStr}`
}