import React from "react";

export const Track = ({ source, target, getTrackProps }) => { // your own track component
  return (
    <div
      style={{
        position: 'absolute',
        height: 6, // 10,
        zIndex: 1,
        marginTop: 35,
        backgroundColor: 'purple', // '#546C91',
        borderRadius: 5,
        cursor: 'pointer',
        left: `${source.percent}%`,
        width: `${target.percent - source.percent}%`,
      }}
      {...getTrackProps()} 
    />
  )
}