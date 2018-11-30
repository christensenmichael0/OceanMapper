import React from "react";
import PropTypes from "prop-types";
import { formatDateTime } from '../scripts/formatDateTime';

function Tick({ tick, count, format }) {
  return (
    <div>
      <div
        style={{
          position: "absolute",
          width: 1,
          height: 5,
          backgroundColor: "rgb(200,200,200)",
          left: `${tick.percent*100}%`
        }}
      />
      <div
        style={{
          position: "absolute",
          marginTop: 7,
          fontSize: 10,
          fontFamily: "Arial",
          textAlign: "center",
          marginLeft: `${-(100 / count) / 2}%`,
          width: `${100 / count}%`,
          left: `${tick.percent*100}%`
        }}
      >
        {format(tick.value,'MM/DD','')}
      </div>
    </div>
  );
}

Tick.propTypes = {
  tick: PropTypes.shape({
    id: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    percent: PropTypes.number.isRequired
  }).isRequired,
  count: PropTypes.number.isRequired,
  format: PropTypes.func.isRequired
};

Tick.defaultProps = {
  //format: d => d
  format: formatDateTime
};

export default Tick