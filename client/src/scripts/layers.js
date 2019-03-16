export const imageLayers = ['getLeaseAreas', 'getLeaseBlocks', 'getTropicalActivity'];
export const tileLayers = ['getModelField', 'getGebcoBathy'];
export const dataLayers = ['getModelField','getActiveDrilling'];
export const staticLegendEndpoint = 'https://s3.us-east-2.amazonaws.com/oceanmapper-data-storage/dynamic_legend_cache/';

const dynamicLegendEndpoint = 'https://5qkqvek867.execute-api.us-east-2.amazonaws.com/staging/legend';

export const layers = [
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
          shortName: 'Current Speed',
          overlayType: 'ocean',
          legendUrl: dynamicLegendEndpoint,
          availableLevels: [],
          levelName: 'Depth (m)',
          addDataFunc: 'getModelField',
          chartType: 'series-vector',
          directionConvention: 'toward',
          maxNativeZoom: 3,
          minNativeZoom: 3,
          streamFlowLayer: true,
          maxVelocity: 1.0,
          velocityScale: 0.1,
          timeSensitive: true,
          rasterProps: {
            opacity: 1.0,
            absoluteMin: 0,
            absoluteMax: 4,
            currentMin: 0,
            currentMax: 2,
            interval: 0.125,
            colormap: 'magma',
            label: 'Current Speed (m/s)',
            dataRangeIntervals: [0.125, .25, .5, 1],
            colorramps: ['viridis', 'magma', 'jet', 'rainbow', 'cool']
          },
          visibleTOC: false,
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
          shortName: 'Current Speed',
          overlayType: 'ocean',
          legendUrl: dynamicLegendEndpoint,
          availableLevels: [],
          levelName: 'Depth (m)',
          addDataFunc: 'getModelField',
          chartType: 'series-vector',
          directionConvention: 'toward',
          maxNativeZoom: 3,
          minNativeZoom: 3,
          streamFlowLayer: true,
          maxVelocity: 1.0,
          velocityScale: 0.15,
          streamFlowColorScale: ['#000004', '#51127c', '#b73779', '#fc8961', '#fcfdbf'],
          timeSensitive: true,
          rasterProps: {
            opacity: 1.0,
            absoluteMin: 0,
            absoluteMax: 4,
            currentMin: 0,
            currentMax: 2,
            interval: 0.125,
            colormap: 'magma',
            label: 'Current Speed (m/s)',
            dataRangeIntervals: [0.125, .25, .5, 1],
            colorramps: ['viridis', 'magma', 'jet', 'rainbow', 'cool']
          },
          visibleTOC: true,
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
          shortName: 'Wind Speed',
          overlayType: 'all',
          legendUrl: dynamicLegendEndpoint,
          availableLevels: [],
          levelName: 'Height (m)',
          addDataFunc: 'getModelField',
          chartType: 'series-vector',
          directionConvention: 'from',
          maxNativeZoom: 3,
          minNativeZoom: 3,
          streamFlowLayer: true,
          maxVelocity: 20.0,
          velocityScale: 0.01,
          streamFlowColorScale: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'],
          timeSensitive: true,
          rasterProps: {
            opacity: 1.0,
            absoluteMin: 0,
            absoluteMax: 80,
            currentMin: 0,
            currentMax: 25,
            interval: 1,
            colormap: 'viridis',
            label: 'Wind Speed (m/s)',
            dataRangeIntervals: [1, 5, 10],
            colorramps: ['viridis', 'magma', 'jet', 'rainbow', 'cool']
          },
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
          niceName: 'WW3 Signficant Wave Height',
          shortName: 'Significant Wave Height',
          overlayType: 'ocean',
          legendUrl: dynamicLegendEndpoint,
          availableLevels: [],
          addDataFunc: 'getModelField',
          chartType: 'series',
          maxNativeZoom: 3,
          minNativeZoom: 3,
          timeSensitive: true,
          rasterProps: {
            opacity: 1.0,
            absoluteMin: 0,
            absoluteMax: 20,
            currentMin: 0,
            currentMax: 10,
            interval: 1,
            colormap: 'jet',
            label: 'Significant Wave Height (m)',
            dataRangeIntervals: [0.5, 1, 2],
            colorramps: ['viridis', 'magma', 'jet', 'rainbow', 'cool']
          },
          visibleTOC: true,
          defaultOn: false
        },
        {
          id: 'ww3_primary_wave_dir',
          s3Name: 'primary_wave_dir',
          niceName: 'WW3 Primary Wave Direction',
          shortName: 'Primary Wave Direction',
          overlayType: 'ocean',
          overlayPriority: 'high',
          legendUrl: '',
          availableLevels: [],
          addDataFunc: 'getModelField',
          chartType: 'vector',
          directionConvention: 'from',
          maxNativeZoom: 4,
          minNativeZoom: 3,
          timeSensitive: true,
          rasterProps: {
            opacity: 1.0
          },
          visibleTOC: true,
          defaultOn: false
        },
        {
          id: 'ww3_primary_wave_period',
          s3Name: 'primary_wave_period',
          niceName: 'WW3 Primary Wave Period',
          shortName: 'Primary Wave Period',
          overlayType: 'ocean',
          legendUrl: dynamicLegendEndpoint,
          availableLevels: [],
          addDataFunc: 'getModelField',
          chartType: 'series',
          maxNativeZoom: 3,
          minNativeZoom: 3,
          timeSensitive: true,
          rasterProps: {
            opacity: 1.0,
            absoluteMin: 0,
            absoluteMax: 25,
            currentMin: 0,
            currentMax: 20,
            interval: 1,
            colormap: 'cool',
            label: 'Primary Wave Period (s)',
            dataRangeIntervals: [1],
            colorramps: ['viridis', 'magma', 'jet', 'rainbow', 'cool']
          },
          visibleTOC: true,
          defaultOn: false
        }
      ]
    }]
  },
  {
    Category: 'Oil & Gas',
    visibleTOC: true,
    expanded: true,
    Layers: [
      {
        id: 'active_drilling',
        niceName: 'Current Deepwater Activity',
        overlayPriority: 'highest',
        addDataFunc: 'getActiveDrilling',
        endPoint: '/download/current_deepwater_activity.json',
        timeSensitive: false,
        visibleTOC: true,
        defaultOn: true
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
        rasterProps: {
          opacity: 1.0
        },
        visibleTOC: true,
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
        rasterProps: {
          opacity: 1.0
        },
        visibleTOC: true,
        defaultOn: true
      },
      {
        id: 'ocs_lease_blocks',
        niceName: 'BOEM OCS Lease Blocks',
        overlayPriority: 'medium',
        endPoint: 'https://gis.boem.gov/arcgis/rest/services/BOEM_BSEE/MMC_Layers/MapServer/export?dpi=96&transparent=true&format=png32&layers=show:11&bbox=#bbox&bboxSR=102100&imageSR=102100&size=#width,#height&f=image',
        addDataFunc: 'getLeaseBlocks',
        timeSensitive: false,
        movementSensitive: true,
        rasterProps: {
          opacity: 1.0
        },
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
        rasterProps: {
          opacity: 1.0
        },
        visibleTOC: true,
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
        rasterProps: {
          opacity: 1.0
        },
        visibleTOC: false,
        defaultOn: false
      },
    ]
  },
];

// export default TOC;