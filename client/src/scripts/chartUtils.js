
/**
 * Construct title for chart
 *
 * @param {array} chartData - an array of objects containing series specific information
 * @returns {str}
 */
export const constructTitle = (chartData) => {
  let datasetTitleArr = [], datasetName, datasetLevel;
  chartData.forEach(dataSource => {

    datasetName = dataSource['niceName'];
    datasetLevel = dataSource['level'] === 'n/a' ? '' : 
      ` (${dataSource['level']}${dataSource['levelUnit']})`;
    
    // append title fragment to array
    datasetTitleArr.push(`${datasetName}${datasetLevel}`)
  })
  return datasetTitleArr.join(', ');
}

/**
 * Construct subtitle for chart
 *
 * @param {obj} activeLocation - object containing keys 'lat', 'lng' representing the active location
 * @param {array} chartLoadingErrors - list of dataset names for which data could not be fetched
 * @returns {str}
 */
export const constructSubTitle = (activeLocation, chartLoadingErrors, chartData=null) => {
  let subTitle = `<span>Coordinates: (${activeLocation['lat'].toFixed(4)}, 
    ${activeLocation['lng'].toFixed(4)})</span>`;

  // loop through errors and append them as new lines to subtitle
  if (chartLoadingErrors.length) {
    let failedFetches = chartLoadingErrors.join(', ');
    let errorText = `<br /><span>*Failed to load: ${failedFetches}</span>`;
    subTitle += errorText;
  }

  if (chartData) {
    // loop through each data source an extract the date valid time
    let modelValidTime, validTimeStr = '';
    chartData.forEach((dataSource, indx) => {
      modelValidTime =`<br /><span>*${dataSource['niceName']} (date valid): ${dataSource['validTime']}</span>`;
      validTimeStr += modelValidTime
    })
    subTitle += validTimeStr;
  }
  return subTitle;
}