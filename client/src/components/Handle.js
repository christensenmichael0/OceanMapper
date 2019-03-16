import React from "react";

export const Handle = ({ handle: { id, value, percent }, getHandleProps}) => {
  return (
    <div
      style={{
        left: `${percent}%`,
        position: 'absolute',
        marginLeft: -10, // -15,
        marginTop: 28,
        zIndex: 2,
        width: 20, // 30,
        height: 20, // 30,
        border: 0,
        textAlign: 'center',
        cursor: 'pointer',
        borderRadius: '50%',
        backgroundColor: 'purple', // '#2C4870',
        color: '#333',
      }}
      {...getHandleProps(id)}
    >
      <div style={{ fontFamily: 'Roboto', fontSize: 11, marginTop: -15 }}>
        {value}
      </div>
    </div>
  )
}