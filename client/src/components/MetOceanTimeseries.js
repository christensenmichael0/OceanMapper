import React from 'react';
import PropTypes from 'prop-types';
import ReactHighcharts from 'react-highcharts';
import moment from 'moment';
import { constructTitle, constructSubTitle } from '../scripts/chartUtils';

const HighchartsVector = require('highcharts/modules/vector.js')
HighchartsVector(ReactHighcharts.Highcharts)

const config = {
    chart: {
      height: 300,
      zoomType: 'xy'
    },
    title: {
      text: 'Title',
    },
    subtitle: {
      text: 'Subtitle Text',
      useHTML: true,
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
        tooltip: {
          followTouchMove: false,
          headerFormat: `<span style="font-size: 10px">{point.key:%Y-%m-%d %H:%M UTC}</span><br/>`,
          pointFormatter: function() {
            var tooltipHTML = `<span style="color:${this.color}">\u25CF</span>`;
            if (this.options.direction) {
              tooltipHTML += `
                ${this.series.name}: <b>${this.options.y.toFixed(1)} ${this.series.options.units} 
                @ ${this.options.direction.toFixed(1)}°</b><br/>
              `;
            } else {
              tooltipHTML += `
                ${this.series.name}: <b>${this.options.y.toFixed(1)} ${this.series.options.units}</b><br/>
              `;
            }

            return tooltipHTML;
          }
        }
      },
      vector: {
        rotationOrigin: 'start',
        showInLegend: false,
        enableMouseTracking: false
      }
    },
    series: [],
    credits: {
      enabled: false
    },
    responsive: {
      rules: [{
        condition: {
          maxWidth: 650 //500
        },
        chartOptions: {
          chart: {
            height: 300 // 265
          },
          navigator: {
              enabled: false
          }
        }
      }]
    }
  }

const MetOceanTimeseries = (props) => {

  const constructYAxis = (chartData) => {
    let yAxisArr = [], yAxisItem, vectorSeries = false;
    chartData.forEach((dataSource,indx) => {

      // no label if vector series
      if (dataSource['series'].length === 1 & dataSource['series'][0]['type'] === 'vector') {
        vectorSeries = true;
      }
      
      yAxisItem = {
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

  const buildConfig = () => {

    const { chartData, activeLocation, chartLoadingErrors } = props;
    let title = constructTitle(chartData);
    let subTitle = constructSubTitle(activeLocation, chartLoadingErrors);
    let yAxis = constructYAxis(chartData);

    // lets build the series array first
    let seriesArr = [];
    chartData.forEach((dataSource, indx) => {
      dataSource['series'].forEach(series => {
        let seriesObj = { 
          name: dataSource['niceName'],
          color: ReactHighcharts.Highcharts.getOptions().colors[indx],
          type: series['type'],
          yAxis: indx,
          data: series['data']
        };

        if (series['type'] !== 'vector') {
          seriesObj['units'] = dataSource['units'];
        }
        seriesArr.push(seriesObj);
      })
    })

    // populate config
    config['title']['text'] = title;
    config['subtitle']['text'] = subTitle;
    config['yAxis'] = yAxis;
    config['series'] = seriesArr;
    return config
  }

  return (
    <div>
      <ReactHighcharts 
        config={buildConfig()}>
      </ReactHighcharts>
    </div>
  )
}

MetOceanTimeseries.propTypes = {
  chartData: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default MetOceanTimeseries;
