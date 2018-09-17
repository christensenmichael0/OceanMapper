# some configuration variables for apis

datasets = {
    'hycom_currents': {
        's3_folder': 'HYCOM_OCEAN_CURRENTS_3D',
        'overlay_type': 'ocean',
        'var_type': 'speed',
        'data_type': 'json', 
        'scalar_tiles': True, 
        'vector_tiles': False
    },
    'rtofs_currents': {
        's3_folder': 'RTOFS_OCEAN_CURRENTS_3D',
        'overlay_type': 'ocean',
        'var_type': 'speed',
        'data_type': 'json',
        'scalar_tiles': True, 
        'vector_tiles': False
    },
    'gfs_winds': {
        's3_folder':'GFS_WINDS',
        'overlay_type': 'all',
        'var_type': 'speed',
        'data_type': 'json',
        'scalar_tiles': True, 
        'vector_tiles': False
    },
    'ww3_data': {
        's3_folder': 'WAVE_WATCH_3',
        'sub_resources': ['sig_wave_height','primary_wave_dir','primary_wave_period'],
        'overlay_type': 'ocean',
        'var_type': 'non-speed',
        'data_type': 'pickle',
        'scalar_tiles': True, 
        'vector_tiles': True
    }
}