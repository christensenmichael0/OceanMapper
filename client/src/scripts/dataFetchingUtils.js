import { formatDateTime } from './formatDateTime';


// TODO: getModelField constructs endpoint url using input params and then calls getData(endpoint)
export const getModelField = (dataset, subResource, level, time) => {
  let formattedTime = `${formatDateTime(time, 'YYYY-MM-DDTHH:mm', '')}Z`;
  let levelStr = isNaN(level) ? 'level=' : `level=${level}`;
  let endpoint = `/data/individual-field?dataset=${dataset}&sub_resource=${subResource}&${levelStr}&time=${formattedTime}`;
  return getData(endpoint);
}

// https://developers.google.com/web/fundamentals/primers/async-functions
// use this to simplify other request... pass in enpoint as an argument
export const getData = async (endpoint) => {
  // let endpoint = '/data/individual-field?level=0&time=2018-12-15T02:00Z&sub_resource=ocean_current_speed&dataset=HYCOM_DATA'
  try {
    const response = await fetch(endpoint); // sends request
    if (response.ok) {
      const jsonResponse = await response.json();
      // code to execute with jsonResponse
      return jsonResponse
    }
    throw new Error('Request Failed!');
  } catch (error) {
    console.log(error);
  }
}


// export const dataFetchMap = {
//   'getModelField': getModelField,
//   'getGebcoBathy': 'http://tileservice.charts.noaa.gov/tiles/50000_1/{z}/{x}/{y}.png'
// }