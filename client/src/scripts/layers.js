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
          overlayType: 'ocean',
          legendUrl: 'https://s3.us-east-2.amazonaws.com/oceanmapper-data-storage/map_legends/current_speed_colorbar.png',
          availableLevels: [],
          levelName: 'Depth (m)',
          addDataFunc: 'getModelField',
          maxNativeZoom: 3,
          minNativeZoom: 3,
          streamFlowLayer: true,
          maxVelocity: 1.0,
          velocityScale: 0.1,
          timeSensitive: true,
          visibleTOC: false,
          defaultOpacity: 1.0,
          defaultOn: false
        }
      ]
    },
    {
      s3Name: 'RTOFS_DATA',
      niceName: 'RTOFS',
      visibleTOC: true,
      subResources: [
        {
          id: 'rtofs_currents',
          s3Name: 'ocean_current_speed',
          niceName: 'RTOFS Currents',
          overlayType: 'ocean',
          legendUrl: 'https://s3.us-east-2.amazonaws.com/oceanmapper-data-storage/map_legends/current_speed_colorbar.png',
          availableLevels: [],
          levelName: 'Depth (m)',
          addDataFunc: 'getModelField',
          maxNativeZoom: 3,
          minNativeZoom: 3,
          streamFlowLayer: true,
          maxVelocity: 1.0,
          velocityScale: 0.15,
          timeSensitive: true,
          visibleTOC: true,
          defaultOpacity: 1.0,
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
          overlayType: 'all',
          legendUrl: 'https://s3.us-east-2.amazonaws.com/oceanmapper-data-storage/map_legends/wind_speed_colorbar.png',
          availableLevels: [],
          levelName: 'Height (m)',
          addDataFunc: 'getModelField',
          maxNativeZoom: 3,
          minNativeZoom: 3,
          streamFlowLayer: true,
          maxVelocity: 20.0,
          velocityScale: 0.01,
          timeSensitive: true,
          visibleTOC: true,
          defaultOpacity: 1.0,
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
          overlayType: 'ocean',
          legendUrl: 'https://s3.us-east-2.amazonaws.com/oceanmapper-data-storage/map_legends/wave_amp_colorbar.png',
          availableLevels: [],
          addDataFunc: 'getModelField',
          maxNativeZoom: 3,
          minNativeZoom: 3,
          timeSensitive: true,
          visibleTOC: true,
          defaultOpacity: 1.0,
          defaultOn: false
        },
        {
          id: 'ww3_primary_wave_dir',
          s3Name: 'primary_wave_dir',
          niceName: 'WW3 Primary Wave Direction',
          overlayType: 'ocean',
          overlayPriority: 'high',
          legendUrl: '',
          availableLevels: [],
          addDataFunc: 'getModelField',
          maxNativeZoom: 4,
          minNativeZoom: 3,
          timeSensitive: true,
          visibleTOC: true,
          defaultOpacity: 1.0,
          defaultOn: false
        },
        {
          id: 'ww3_primary_wave_period',
          s3Name: 'primary_wave_period',
          niceName: 'WW3 Primary Wave Period',
          overlayType: 'ocean',
          legendUrl: 'https://s3.us-east-2.amazonaws.com/oceanmapper-data-storage/map_legends/wave_period_colorbar.png',
          availableLevels: [],
          addDataFunc: 'getModelField',
          maxNativeZoom: 3,
          minNativeZoom: 3,
          timeSensitive: true,
          visibleTOC: true,
          defaultOpacity: 1.0,
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
        addDataFunc: 'getActiveDrilling',
        timeSensitive: false,
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
        overlayPriority: 'medium',
        addDataFunc: 'placeholder',
        timeSensitive: false,
        visibleTOC: true,
        defaultOpacity: 1.0,
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
        id: 'ocs_leasing_extents',
        niceName: 'BOEM OCS Protraction Diagrams & Leasing Maps',
        overlayPriority: 'high',
        endPoint: 'https://gis.boem.gov/arcgis/services/BOEM_BSEE/MMC_Layers/MapServer/WmsServer',
        addDataFunc: 'getLeaseAreas',
        timeSensitive: false,
        movementSensitive: true,
        visibleTOC: true,
        defaultOn: false
      },
      {
        id: 'ocs_lease_blocks',
        niceName: 'BOEM OCS Lease Blocks',
        overlayPriority: 'medium',
        endPoint: 'https://gis.boem.gov/arcgis/services/BOEM_BSEE/MMC_Layers/MapServer/WmsServer',
        addDataFunc: 'getLeaseBlocks',
        timeSensitive: false,
        movementSensitive: true,
        visibleTOC: true,
        defaultOn: false
      },
      {
        id: 'gebco_bathy',
        niceName: 'GEBCO Bathmetry',
        overlayPriority: 'medium',
        endPoint: 'https://gis.ngdc.noaa.gov/arcgis/rest/services/web_mercator/gebco_2014_contours/MapServer/tile/{z}/{y}/{x}',
        addDataFunc: 'getGebcoBathy',
        timeSensitive: false,
        visibleTOC: true,
        defaultOpacity: 1.0,
        defaultOn: false
      },
      {
        id: 'transparent_basemap',
        niceName: 'Transparent Basemap',
        overlayPriority: 'high',
        endPoint: 'https://s3.us-east-2.amazonaws.com/oceanmapper-data-storage/basemap_tiles/{z}/{x}/{y}.png',
        addDataFunc: 'getTransparentBasemap',
        maxNativeZoom: 8, // change to 8 when ready
        minNativeZoom: 3,
        timeSensitive: false,
        visibleTOC: false,
        defaultOpacity: 1.0,
        defaultOn: false
      },
    ]
  },
];

export default TOC;