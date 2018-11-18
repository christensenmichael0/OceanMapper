let metocDatasetMapping = {
  HYCOM_DATA: {
    niceName: 'HYCOM CURRENTS',
    visibleTOC: true,
    subResources: {
      ocean_current_speed: {
        niceName: 'HYCOM Currents', 
        availableLevels: [],
        visibleTOC: true,
        defaultOn: false
      }
    }
  },
  RTOFS_DATA: {
    niceName: 'RTOFS CURRENTS',
    visibleTOC: false,
    subResources: {
      ocean_current_speed: {
        niceName: 'RTOFS Currents', 
        availableLevels: [],
        visibleTOC: false,
        defaultOn: false
      }
    }
  },
  GFS_DATA: {
    niceName: 'GFS WINDS',
    visibleTOC: true,
    subResources: {
      wind_speed: {
        niceName: 'GFS Winds', 
        availableLevels: [],
        visibleTOC: true,
        defaultOn: false
      }
    }
  },
  WW3_DATA: {
    niceName: 'WAVEWATCH3',
    visibleTOC: true,
    subResources: {
      sig_wave_height: {
        niceName: ' WW3 Signficant Wave Height', 
        availableLevels: [],
        visibleTOC: true,
        defaultOn: false
        },
      primary_wave_dir: {
        niceName: 'WW3 Primary Wave Direction', 
        availableLevels: [],
        visibleTOC: true,
        defaultOn: false
      },
      primary_wave_period: {
        niceName: 'WW3 Primary Wave Period', 
        availableLevels: [],
        visibleTOC: true,
        defaultOn: false
      }
    }
  }
}

export default metocDatasetMapping;