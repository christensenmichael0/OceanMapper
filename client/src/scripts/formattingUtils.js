export const populateImageUrlEndpoint = (urlEndpoint, mapProps) => {
  let layerEndpointUrl = urlEndpoint.replace('#width',mapProps['width']).replace('#height', mapProps['height']).replace(
    '#bbox', `${mapProps['swCorner']['x']},${mapProps['swCorner']['y']},
    ${mapProps['neCorner']['x']},${mapProps['neCorner']['y']}`).replace(/\s+/g, '');

  return layerEndpointUrl;
}
