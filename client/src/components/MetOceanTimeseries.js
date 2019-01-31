import React from 'react';
import PropTypes from 'prop-types';
import ReactHighcharts from 'react-highcharts';

const HighchartsVector = require('highcharts/modules/vector.js')
HighchartsVector(ReactHighcharts.Highcharts)


const MetOceanTimeseries = (props) => {
  // const { series, title } = props;

  const config = {

    title: {
      text: 'Title Text'
    },

    subtitle: {
      text: 'Subtitle Text'
    },

    yAxis: {
      title: {
        text: 'YAxis Title'
      }
    },
    // legend: {
    //   layout: 'vertical',
    //   align: 'right',
    //   verticalAlign: 'middle'
    // },

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

    series: [{
      name: 'Magnitude',
      data: [[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7],[8,8]]
    },{
        type: 'vector',
        name: 'Sample vector field',
        color: ReactHighcharts.Highcharts.getOptions().colors[1],
        data: [[0, 1, 150, 18],[1,1,150, 90],[2,1,150, 90],[3,1,150, 90],[4,1,150, 90]]
    }],
    credits: {
      enabled: false
    },
  }
  // debugger
  return (
    <div className='custom-highchart-container'>
      <ReactHighcharts config={config}></ReactHighcharts>
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


