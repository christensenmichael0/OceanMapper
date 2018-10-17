import pickle
import datetime
import copy
import io
import os

import boto3
import numpy as np
import mercantile
import pyproj
from matplotlib import pyplot as plt, cm
import matplotlib.colors as colors
import cmocean

s3 = boto3.client('s3')

cmap_config = {
    'wind_speed': {
        'color_map': cm.get_cmap('viridis'), 
        'data_range': [0,25],
        'cb_ticks': [0,5,10,15,20,25],
        'cb_label': 'Wind Speed (m/s)'
    },
    'current_speed': {
        'color_map': cm.get_cmap('magma'), 
        'data_range': [0,2],
        'cb_ticks': [0,0.25,0.5,0.75,1.0,1.25,1.5,1.75,2.0],
        'cb_label': 'Current Speed (m/s)'
    },
    'wave_amp': {
        'color_map': cm.get_cmap('jet'), 
        'data_range': [0,11],
        'cb_ticks': range(11),
        'cb_label': 'Significant Wave Height (m)'
    },
    'wave_dir': {'color_map': None, 'data_range': [None, None]},
    'wave_period': {
        'color_map': cm.get_cmap('cool'), 
        'data_range': [0,21],
        'cb_ticks': range(0,21,5),
        'cb_label': 'Primary Wave Period (s)'
    },
}

bucket_name = 'oceanmapper-data-storage'

def create_legend(info):
    """
    create_legend(info)

    This function is used to create legend graphics for various datasets
    -----------------------------------------------------------------------
    Inputs:

    info (obj) -information object that contains these keys: 
    'pickle_filepath': (string) the location of the pickle data file
    'data_type': (string) - one of 'wind_speed', 'current_speed', 'wave_height', 'wave_period'
    -----------------------------------------------------------------------
    Notes:
    https://stackoverflow.com/questions/40813148/save-colorbar-for-scatter-plot-separately
    -----------------------------------------------------------------------
    Output: A .png legend image which is saved to S3
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 10/16/2018
    """

    # get info paramaters
    pickle_filepath = info['pickle_filepath']
    data_type = info['data_type']

    # load data
    pickle_data = s3.get_object(Bucket=bucket_name, Key=pickle_filepath)
    body_string = pickle_data['Body'].read()
    data = pickle.loads(body_string)

    # process the data in preparation for tiling
    if np.ma.is_masked(data['lat']):
        lat = data['lat'].data
    else:
        lat = data['lat']

    if np.ma.is_masked(data['lon']):
        lon = data['lon'].data
    else:
        lon = data['lon']

    # remove the north/south pole lats since these cause issues when projecting to epsg:3857
    keep_lat_bool = np.logical_and(lat<90, lat>-90)
    keep_lat_indx = np.argwhere(keep_lat_bool).ravel()
    lat_trim = lat[keep_lat_indx]

    # create lat/lon mesh grid
    _lon,_lat = np.meshgrid(lon,lat_trim)

    # project to EPSG:3857 for plotting
    EPSG3857 = pyproj.Proj(init='EPSG:3857')
    lo,la = EPSG3857(_lon,_lat)

    # sort by EPSG3857 because our drawing surface is in EPSG3857, data still ordered by lon/lat
    so = np.argsort(lo[1,:])
    sa = np.argsort(la[:,1])

    proj_lon_array = lo[sa,:][:,so]
    proj_lat_array = la[sa,:][:,so]

    data_cmap = cmap_config[data_type]['color_map']
    cmin, cmax = cmap_config[data_type]['data_range']

    FIGSIZE = (6,6)
    plt.figure(figsize=FIGSIZE)

    if data_type == 'wind_speed' or data_type == 'current_speed':

        u_vel = (data['u_vel'][keep_lat_indx,:]).astype('float64')
        v_vel = (data['v_vel'][keep_lat_indx,:]).astype('float64')

        data_array = np.sqrt((u_vel**2) + (v_vel**2))

        nlvls = 100
        lvls = np.linspace(cmin, cmax, nlvls)

        ## filled contour (use SORTED indexes for the EPSG3857 drawing surface)
        contourf = plt.contourf(proj_lon_array, proj_lat_array, data_array[sa,:][:,so], 
            levels=lvls, cmap=data_cmap)

    elif data_type == 'wave_amp':

        height_raw = data['sig_wave_height'][keep_lat_indx,:]
        
        palette = copy.copy(data_cmap)
        palette.set_bad(alpha = 0.0)
        # ax.pcolormesh(proj_lon_array, proj_lat_array, height_raw, shading='flat', cmap=palette,
        # norm=colors.BoundaryNorm([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],ncolors=palette.N))

        lvls = range(cmin, cmax)
        contourf = plt.contourf(proj_lon_array, proj_lat_array, height_raw[sa,:][:,so], cmap=palette,
        levels=lvls)

    elif data_type == 'wave_period':

        period_raw = data['primary_wave_period'][keep_lat_indx,:]
        
        palette = copy.copy(data_cmap)
        palette.set_bad(alpha = 0.0)
        
        lvls = range(cmin, cmax)
        contourf = plt.contourf(proj_lon_array, proj_lat_array, period_raw[sa,:][:,so], cmap=palette,
        levels=lvls)
    else:
        pass

    build_colormap(contourf, data_type, FIGSIZE)
    plt.close()


def build_colormap(plot_obj, data_type, FIGSIZE):
    """
    build_colormap(plot_obj, data_type, FIGSIZE)

    This function is used to build a standalone colormap which is properly cropped
    -----------------------------------------------------------------------
    Inputs:

    plot_obj (obj) - plotting object
    data_type: (string) - one of 'wind_speed', 'current_speed', 'wave_height', 'wave_period'
    FIGSIZE: (tuple) - width, height of the figure in inches
    -----------------------------------------------------------------------
    Notes:
    https://stackoverflow.com/questions/40813148/save-colorbar-for-scatter-plot-separately
    -----------------------------------------------------------------------
    Output: A .png legend image which is saved to S3
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 10/16/2018
    """

    # draw a new figure and replot the colorbar there
    fig,ax = plt.subplots(figsize=FIGSIZE)

    cb_ticks = cmap_config[data_type]['cb_ticks']
    cb_ticks_labels = [str(tick) for tick in cb_ticks]
    cb_ticks_labels[-1] = cb_ticks_labels[-1] + '+'

    cbar = plt.colorbar(plot_obj, ticks=cb_ticks, orientation='horizontal', ax=ax)
    cb_label = cmap_config[data_type]['cb_label']
    cbar.ax.set_xlabel(cb_label)

    # update the tick labels
    cbar.ax.set_xticklabels(cb_ticks_labels)
    
    ax.remove()

    # save the figure to S3
    filename = 'map_legends/{0}_colorbar.png'.format(data_type)
    with io.BytesIO() as out_img:
        fig.savefig(out_img,format='png', bbox_inches='tight')
        out_img.seek(0)
        s3.put_object(Body=out_img, Bucket=bucket_name, Key=filename,
            ACL='public-read')


if __name__ == "__main__":

    data_info_obj = {
        'ww3_period': {
            'pickle_filepath': 'WW3_DATA/20181023_00/primary_wave_period/pickle/ww3_perpwsfc_20181023_00.pickle',
            'data_type': 'wave_period',
        },
        'ww3_height': {
            'pickle_filepath': 'WW3_DATA/20181023_00/sig_wave_height/pickle/ww3_htsgwsfc_20181023_00.pickle',
            'data_type': 'wave_amp',
        },
        'hycom_currents': {
            'pickle_filepath': 'HYCOM_DATA/20181015_00/ocean_current_speed/0m/pickle/hycom_currents_20181015_00.pickle',
            'data_type': 'current_speed',
        },
        'gfs_winds': {
            'pickle_filepath': 'GFS_DATA/20181026_00/wind_speed/10m/pickle/gfs_winds_20181026_00.pickle',
            'data_type': 'wind_speed',
        }
    }
    
    for element in data_info_obj:
        create_legend(data_info_obj[element])

