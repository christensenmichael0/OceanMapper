import React from 'react';
import PropTypes from 'prop-types';
import ReactHighcharts from 'react-highcharts';

const HighchartsVector = require('highcharts/modules/vector.js')
HighchartsVector(ReactHighcharts.Highcharts)

const config = {
    chart: {
      height: 500,
      zoomType: 'xy',
      type: 'line',
      inverted: true
    },
    title: {
      text: 'Title',
    },
    subtitle: {
      text: 'Subtitle Text',
      useHTML: true,
    },
    xAxis: {
      title: {
        text: 'Depth'
      },
      gridLineWidth: 1,
      reversed: false,
      opposite: false
    },
    yAxis: {
      title: {
        text: 'YAxis Title'
      },
      floor: 0
    },
    plotOptions: {
      series: {
        tooltip: {
          followTouchMove: false,
          headerFormat: `<span style="font-size: 10px">{point.x} {series.options.levelUnit}</span><br/>`,
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
          maxWidth: 500
        },
        chartOptions: {
          chart: {
            height: 300
          },
          navigator: {
              enabled: false
          }
        }
      }]
    }
  }

const MetOceanProfile = (props) => {
  // const { series, title } = props;

  // TODO: move this to a seperate file and import in both charting files
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

  // TODO: include date valid in subtitle
  const constructSubTitle = () => {
    let subTitle = `<span>Coordinates: (${props['activeLocation']['lat'].toFixed(4)}, 
      ${props['activeLocation']['lng'].toFixed(4)})</span>`;

    // loop through errors and append them as new lines to subtitle
    if (props.chartLoadingErrors.length) {
      let failedFetches = props.chartLoadingErrors.join(', ');
      let errorText = `<br /><span>*Failed to load: ${failedFetches}</span>`;
      subTitle += errorText;
    }
    return subTitle;
  }

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
        opposite: false
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
        let seriesObj = { 
          name: dataSource['niceName'],
          color: ReactHighcharts.Highcharts.getOptions().colors[indx],
          type: series['type'],
          yAxis: indx,
          levelUnit: dataSource['levelUnit'],
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
    config['xAxis']['labels'] = {format: `{value} ${chartData[0]['levelUnit']}`}; // just pick the first series to figure out units
    config['series'] = seriesArr;
    return config
  }

  return (
    <div>
      <ReactHighcharts 
        config={buildConfig(props.chartData)}>
      </ReactHighcharts>
    </div>
  )
}

MetOceanProfile.propTypes = {
  chartData: PropTypes.arrayOf(PropTypes.object).isRequired
};


export default MetOceanProfile;


