import React from "react";
import { withTheme } from '@material-ui/core/styles';

const Track = ({ source, target, getTrackProps, theme }) => { // your own track component
  return (
    <div
      style={{
        position: 'absolute',
        height: 2,
        zIndex: 1,
        marginTop: 25,
        backgroundColor: theme.palette.secondary.main,
        borderRadius: 5,
        cursor: 'pointer',
        left: `${source.percent}%`,
        width: `${target.percent - source.percent}%`,
      }}
      {...getTrackProps()} 
    />
  )
}

export default withTheme()(Track);