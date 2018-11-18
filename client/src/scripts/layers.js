let TOC = [
  {
    Category: 'MetOcean',
    visibleTOC: true,
    expanded: true,
    Layers: [{
      s3Name: 'HYCOM_DATA',
      niceName: 'HYCOM',
      visibleTOC: true,
      subResources: [
        {
          id: 'hycom_currents',
          s3Name: 'ocean_current_speed',
          niceName: 'HYCOM Currents', 
          availableLevels: [],
          visibleTOC: true,
          defaultOn: true
        }
      ]
    },
    {
      s3Name: 'RTOFS_DATA',
      niceName: 'RTOFS',
      visibleTOC: false,
      subResources: [
        {
          id: 'rtofs_currents',
          s3Name: 'ocean_current_speed',
          niceName: 'RTOFS Currents', 
          availableLevels: [],
          visibleTOC: false,
          defaultOn: false
        }
      ]
    },
    {
      s3Name: 'GFS_DATA',
      niceName: 'GFS',
      visibleTOC: true,
      subResources: [
        {
          id: 'gfs_winds',
          s3Name: 'wind_speed',
          niceName: 'GFS Winds', 
          availableLevels: [],
          visibleTOC: true,
          defaultOn: false
        }
      ]
    },
    {
      s3Name: 'WW3_DATA',
      niceName: 'WAVEWATCH3',
      visibleTOC: true,
      subResources: [
        {
          id: 'ww3_sig_wave_height',
          s3Name: 'sig_wave_height',
          niceName: ' WW3 Signficant Wave Height', 
          availableLevels: [],
          visibleTOC: true,
          defaultOn: false
        },
        {
          id: 'www_primary_wave_dir',
          s3Name: 'primary_wave_dir',
          niceName: 'WW3 Primary Wave Direction', 
          availableLevels: [],
          visibleTOC: true,
          defaultOn: false
        },
        {
          id: 'ww3_primary_wave_period',
          s3Name: 'primary_wave_period',
          niceName: 'WW3 Primary Wave Period', 
          availableLevels: [],
          visibleTOC: true,
          defaultOn: false
        }
      ]
    }]
  },
  {
    Category: 'Oil & Gas',
    visibleTOC: true,
    expanded: false,
    Layers: [
      {
        id: 'active_drilling',
        niceName: 'Active Drilling',
        visibleTOC: true,
        defaultOn: false
      }
    ]
  },
  {
    Category: 'Tropical Cyclones',
    visibleTOC: true,
    expanded: false,
    Layers: [
      {
        id: 'tropcial_storms_track_forecast',
        niceName: 'Track Forecast',
        visibleTOC: true,
        defaultOn: false
      }
    ]
  },
  {
    Category: 'Overlays',
    visibleTOC: true,
    expanded: false,
    Layers: [
      {
        id: 'gom_lease_blocks',
        niceName: 'GOM Lease Blocks',
        visibleTOC: true,
        defaultOn: false
      },
      {
        id: 'gebco_bathy',
        niceName: 'GEBCO Bathmetry',
        visibleTOC: true,
        defaultOn: false
      }
    ]
  },
];

export default TOC;