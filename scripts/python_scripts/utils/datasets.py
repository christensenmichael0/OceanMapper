# some configuration variables for apis

datasets = {
    'HYCOM_DATA': {
        'sub_resource': {
            'ocean_current_speed': {
                'data_prefix': 'hycom_currents',
                'variables': ['u_vel','v_vel'],
                'overlay_type': 'ocean',
                'data_type': 'json', 
                'scalar_tiles': True, 
                'vector_tiles': False,
                'data_tiles_zoom_level': [1,2,3],
                'units': 'm/s'
            }
        }
    },
    'RTOFS_DATA': {
        'sub_resource': {
            'ocean_current_speed': {
                'data_prefix': 'rtofs_currents',
                'variables': ['u_vel','v_vel'],
                'overlay_type': 'ocean',
                'data_type': 'json', 
                'scalar_tiles': True, 
                'vector_tiles': False,
                'data_tiles_zoom_level': [1,2,3],
                'units': 'm/s'
            }
        }
    },
    'GFS_DATA': {
        'sub_resource': {
            'wind_speed': {
                'data_prefix': 'gfs_winds',
                'variables': ['u_vel','v_vel'],
                'overlay_type': 'all',
                'data_type': 'json', 
                'scalar_tiles': True, 
                'vector_tiles': False,
                'data_tiles_zoom_level': [1,2,3],
                'units': 'm/s'
            }
        }
    },
    'WW3_DATA': {
        'sub_resource': {
            'sig_wave_height': {
                'data_prefix': 'ww3_htsgwsfc',
                'variables': ['sig_wave_height'],
                'overlay_type': 'ocean',
                'data_type': 'pickle', 
                'scalar_tiles': True, 
                'vector_tiles': False,
                'data_tiles_zoom_level': [1,2,3],
                'units': 'm'
            },
            'primary_wave_dir': {
                'data_prefix': 'ww3_dirpwsfc',
                'variables': ['primary_wave_dir'],
                'overlay_type': 'ocean',
                'data_type': 'pickle', 
                'scalar_tiles': False, 
                'vector_tiles': True,
                'data_tiles_zoom_level': [1,2,3],
                'units': 'deg'
            },
            'primary_wave_period': {
                'data_prefix': 'ww3_perpwsfc',
                'variables': ['primary_wave_period'],
                'overlay_type': 'ocean',
                'data_type': 'pickle',
                'scalar_tiles': True, 
                'vector_tiles': False,
                'data_tiles_zoom_level': [1,2,3],
                'units': 's'
            }
        }
    }
}