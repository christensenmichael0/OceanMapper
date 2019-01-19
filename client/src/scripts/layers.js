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
          streamFlowColorScale: ['#000004', '#51127c', '#b73779', '#fc8961', '#fcfdbf'],
          timeSensitive: true,
          visibleTOC: true,
          defaultOpacity: 1.0,
          defaultOn: true
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
          streamFlowColorScale: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'],
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
        niceName: 'Current Deepwater Activity',
        overlayPriority: 'highest',
        addDataFunc: 'getActiveDrilling',
        endPoint: '/download/current_deepwater_activity.json',
        timeSensitive: false,
        visibleTOC: true,
        defaultOn: false
      }
    ]
  },
  {
    Category: 'Tropical Cyclones',
    visibleTOC: true,
    expanded: true,
    Layers: [
      {
        id: 'tropcial_storms_track_forecast',
        niceName: 'Track Forecast',
        overlayPriority: 'medium',
        addDataFunc: 'getTropicalActivity',
        endPoint: 'https://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/wwa_meteocean_tropicalcyclones_trackintensityfcsts_time/MapServer/export?dpi=96&transparent=true&format=png32&layers=show:3,4,5,6,2,8,9&bbox=#bbox&bboxSR=3857&imageSR=3857&size=#width,#height&f=image',
        endPointInfo: 'https://nowcoast.noaa.gov/layerinfo?request=prodtime&service=wwa_meteocean_tropicalcyclones_trackintensityfcsts_time&format=json',
        legendUrl: 'https://nowcoast.noaa.gov/layerinfo?request=legend&format=html&service=wwa_meteocean_tropicalcyclones_trackintensityfcsts_time&layers=3,4,5,6,2,8,9',
        nowCoastDataset: true,
        timeSensitive: false,
        visibleTOC: true,
        defaultOpacity: 1.0,
        defaultOn: true
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
        endPoint: 'https://gis.boem.gov/arcgis/rest/services/BOEM_BSEE/MMC_Layers/MapServer/export?dpi=96&transparent=true&format=png32&layers=show:10&bbox=#bbox&bboxSR=102100&imageSR=102100&size=#width,#height&f=image',
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
        endPoint: 'https://gis.boem.gov/arcgis/rest/services/BOEM_BSEE/MMC_Layers/MapServer/export?dpi=96&transparent=true&format=png32&layers=show:11&bbox=#bbox&bboxSR=102100&imageSR=102100&size=#width,#height&f=image',
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