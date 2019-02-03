import React from 'react';
import PropTypes from 'prop-types';
import ReactHighcharts from 'react-highcharts';
import moment from 'moment';

const HighchartsVector = require('highcharts/modules/vector.js')
HighchartsVector(ReactHighcharts.Highcharts)

const config = {
    title: {
      text: 'Title',
    },
    subtitle: {
      text: 'Subtitle Text'
    },
    xAxis: {
      type: 'datetime',
      gridLineWidth: 1,
       plotLines: [{
        color: '#FF0000',
        width: 0.5,
        value: moment.utc().valueOf()
      }]
    },
    yAxis: {
      title: {
        text: 'YAxis Title'
      }
    },
    plotOptions: {
      series: {
          // general options for all series
      },
      vector: {
        rotationOrigin: 'start',
        showInLegend: false,
        tooltip: {}
      }
    },
    series: [],
    credits: {
      enabled: false
    }
  }

const MetOceanTimeseries = (props) => {
  // const { series, title } = props;

  // TODO: build all parts of config and then inject them and return config

  const constructTitle = (chartData) => {
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

  const constructSubTitle = () => {
    console.log(props);
    let subTitle = `Coordinates: (${props['activeLocation']['lat'].toFixed(4)}, 
      ${props['activeLocation']['lng'].toFixed(4)})`;
    return subTitle;
  }

  const constructYAxis = (chartData) => {
    let yAxisArr = [], yAxisItem, vectorSeries = false;
    chartData.forEach((dataSource,indx) => {

      // no label if vector series
      if (dataSource['series'].length === 1 & dataSource['series'][0]['type'] === 'vector') {
        vectorSeries = true;
      }
      
      let yAxisItem = {
        gridLineWidth: indx > 0 ? 0 : 1,
        labels: {
          format: `{value} ${dataSource['units']}`,
          enabled: !vectorSeries
        },
        title: {
          text: dataSource['shortName'],
        },
        opposite: indx%2 ? true : false
      }

      yAxisArr.push(yAxisItem);
    })
    return yAxisArr;
  }


  const buildConfig = chartData => {

    let title = constructTitle(chartData);
    let subTitle = constructSubTitle();
    let yAxis = constructYAxis(chartData);

    // lets build the series array first
    let seriesArr = [];
    chartData.forEach((dataSource, indx) => {
      dataSource['series'].forEach(series => {
        // TODO: format the times how we want.. fix formatting in tooltip
        let seriesObj = { 
          name: dataSource['niceName'],
          type: series['type'],
          yAxis: indx,
          data: series['data']
        };
        // if vector series then use black
        if (series['type'] === 'vector') {
          seriesObj['color'] = ReactHighcharts.Highcharts.getOptions().colors[1]
        }
        seriesArr.push(seriesObj);
      })
    })

    // populate config
    config['title']['text'] = title;
    config['subtitle']['text'] = subTitle;
    config['yAxis'] = yAxis;
    config['series'] = seriesArr;
    // debugger
    return config
  }



  // const config = {

  //   title: {
  //     text: 'Title', // constructTitle(props.chartData)
  //   },

    // subtitle: {
    //   text: 'Subtitle Text'
    // },

  //   yAxis: {
  //     title: {
  //       text: 'YAxis Title'
  //     }
  //   },
  //   // legend: {
  //   //   layout: 'vertical',
  //   //   align: 'right',
  //   //   verticalAlign: 'middle'
  //   // },

  //   plotOptions: {
  //       series: {
  //           // general options for all series
  //       },
  //       vector: {
  //         rotationOrigin: 'start',
  //         showInLegend: false,
  //         tooltip: {}
  //       }
  //   },

  //   series: [{
  //     name: 'Magnitude',
  //     data: [[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7],[8,8]]
  //   },{
  //       type: 'vector',
  //       name: 'Sample vector field',
  //       color: ReactHighcharts.Highcharts.getOptions().colors[1],
  //       data: [[0, 1, 150, 18],[1,1,150, 90],[2,1,150, 90],[3,1,150, 90],[4,1,150, 90]]
  //   }],
  //   credits: {
  //     enabled: false
  //   },
  // }
  // debugger
  return (
    <div className='custom-highchart-container'>
      {/*<ReactHighcharts config={config}></ReactHighcharts>*/}
      <ReactHighcharts config={buildConfig(props.chartData)}></ReactHighcharts>
    </div>
  )
}

// MetOceanTimeseries.propTypes = {
//   title: PropTypes.string,
//   // series: PropTypes.array.isRequired
// };

// MetOceanTimeseries.defaultProps = {
//   title: 'Distribution of Last Modified Times for Files',

// };


export default MetOceanTimeseries;


