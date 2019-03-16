import React from "react";
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import { staticLegendEndpoint } from '../scripts/layers';

const styles = theme => ({
  img: {
    width: '95%',
  },
});

/** Component used to build a dynamic legend */
const DynamicLegend = (props) => {

  // TODO do i need a function to execute when onload.. show text before that.. (legend building..)

  const colorMap = props['layer']['rasterProps']['colormap'];
  const dataRange = `${props['layer']['rasterProps']['currentMin']},${props['layer']['rasterProps']['currentMax']}`;
  const interval = props['layer']['rasterProps']['interval'];
  const label = props['layer']['rasterProps']['label'];

  const buildStaticLegendUrl = () => {
    
    // backend save legends with 3 decimal places
    let dataRangeLongFormat = `${Number(props['layer']['rasterProps']['currentMin']).toFixed(3)}_
      ${Number(props['layer']['rasterProps']['currentMax']).toFixed(3)}`.replace(/\s/g, "");

    let intervalLongFormat = Number(interval).toFixed(3);
    return `${staticLegendEndpoint}${colorMap}_${dataRangeLongFormat}_${intervalLongFormat}_legend.png`;
  }

  const buildDynamicLegendUrl = (e) => {
    e.target.onerror = null;
    e.target.src = `${props['legendUrl']}?color_map=${colorMap}&data_range=${dataRange}&interval=${interval}&label=${label}`;
  }

  return (
    <div>
      <img 
        src={buildStaticLegendUrl()} 
        alt='data-legend' 
        className={classNames(props.classes.img)}
        onError={buildDynamicLegendUrl.bind(this)}
      />
    </div>
  );
}

export default withStyles(styles, { withTheme: true })(DynamicLegend);
