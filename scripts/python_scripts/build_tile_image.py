import boto3
import pickle
import numpy as np
import mercantile
import pyproj
# import matplotlib
# matplotlib.use('agg')
from matplotlib import pyplot as plt
import matplotlib.colors as colors
import copy
import io
import base64

from process_tiles import make_tile_figure, md2uv
from utils.tile_config import cmap_config

s3 = boto3.client('s3')
bucket = 'oceanmapper-data-storage'

def build_tile_image(incoming_tile, data_key, data_type, additional_params={}):
    """
    build_tile_image(incoming_tile, data_key, data_type, additional_params={})

    Create a single tile with specific styling for consumption in a map
    -----------------------------------------------------------------------
    Inputs:

    incoming_tile (mercantile.Tile): a mercanatile tile with z,x,y params
    data_key (str): the aws s3 location where the 'data tile' exists to create this image tile
    data_type (str): the sub_resource (i.e. ocean_current_speed, wind_speed, signficant_wave_height) (see datasets.py)
    additional_params (obj): an object containing additional style params which are used to override defaults provided
        in utils/tile_config.py
    -----------------------------------------------------------------------
    Ouput: base64 encoded image converted to a utf-8 string
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 02/23/2018
    """

    # deconstruct incoming tile
    i,j,zoom=[*incoming_tile]

    # additional params take precedence over tile config settings
    tile_settings = cmap_config[data_type]
    for prop, val in tile_settings.items():
        param_val = additional_params[prop] if prop in additional_params else val
        tile_settings[prop] = param_val
    
    # load the data 
    try:
        pickle_data = s3.get_object(Bucket=bucket, Key=data_key)
        body_string = pickle_data['Body'].read()
        data = pickle.loads(body_string)
    except Exception as e:
        return

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
    lo,la = EPSG3857(_lon,_lat) # 492 x 540

    # sort by EPSG3857 because our drawing surface is in EPSG3857, data still ordered by lon/lat
    so = np.argsort(lo[1,:]) # (540,)
    sa = np.argsort(la[:,1]) # (492,)

    proj_lon_array = lo[sa,:][:,so]
    proj_lat_array = la[sa,:][:,so]

    data_cmap = tile_settings['color_map'] # cmap_config[data_type]['color_map']
    cmin, cmax = tile_settings['data_range'] # cmap_config[data_type]['data_range']

    # plot entire image on 256 by 256 image then crop to tile extents
    fig, ax = make_tile_figure()
    if data_type == 'wind_speed' or data_type == 'ocean_current_speed':

        u_vel = (data['u_vel'][keep_lat_indx,:]).astype('float64')
        v_vel = (data['v_vel'][keep_lat_indx,:]).astype('float64')

        data_array = np.sqrt((u_vel**2) + (v_vel**2))

        n_lvls = tile_settings['n_levels']
        lvls = np.linspace(cmin, cmax, n_lvls)

        ## filled contour (use SORTED indexes for the EPSG3857 drawing surface)
        contourf = ax.contourf(proj_lon_array, proj_lat_array, data_array[sa,:][:,so], 
            levels=lvls, cmap=data_cmap, extend='both')

    elif data_type == 'sig_wave_height':

        height_raw = data['sig_wave_height'][keep_lat_indx,:]
        
        palette = copy.copy(data_cmap)
        palette.set_bad(alpha = 0.0)
        # ax.pcolormesh(proj_lon_array, proj_lat_array, height_raw, shading='flat', cmap=palette,
        # norm=colors.BoundaryNorm([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],ncolors=palette.N))

        if 'n_levels' in tile_settings:
            n_lvls = tile_settings['n_levels']
            lvls = np.linspace(cmin, cmax, n_lvls)
        else:
            lvls = range(cmin, cmax)
        
        ax.contourf(proj_lon_array, proj_lat_array, height_raw[sa,:][:,so], cmap=palette,
        levels=lvls, extend='both')

    elif data_type == 'primary_wave_dir':
        
        dir_raw = data['primary_wave_dir'][keep_lat_indx,:]
        #directions are in degrees already
        dir_array = dir_raw[sa,:][:,so]
        
        # convert directions into u,v constituents (use unit vector)
        mag_array = np.ones_like(dir_array)
        u_comp,v_comp = md2uv(mag_array, dir_array,'from')

        # TODO: if interpolation is needed in the future see this resource:
        # http://christopherbull.com.au/python/scipy-interpolate-griddata/

        if zoom <= 3:
            row_int = 4
            col_int = 4
        elif zoom == 4:
            row_int = 2
            col_int = 2
        else:
            # show all data
            col_int = 1
            row_int = 1

        quiver = ax.quiver(proj_lon_array[::row_int,::col_int], proj_lat_array[::row_int,::col_int], 
        u_comp[::row_int,::col_int], v_comp[::row_int,::col_int], headwidth=9.0,headlength=8.5, headaxislength=8.0,
        scale_units='width', scale=17.0)

    elif data_type == 'primary_wave_period':

        period_raw = data['primary_wave_period'][keep_lat_indx,:]
        
        palette = copy.copy(data_cmap)
        palette.set_bad(alpha = 0.0)
        
        if 'n_levels' in tile_settings:
            n_lvls = tile_settings['n_levels']
            lvls = np.linspace(cmin, cmax, n_lvls)
        else:
            lvls = range(cmin, cmax)

        ax.contourf(proj_lon_array, proj_lat_array, period_raw[sa,:][:,so], cmap=palette,
        levels=lvls, extend='both')

    else:
        pass 

    # more axes manipulation
    ax.set_frame_on(False)
    ax.set_clip_on(False)
    ax.set_position([0, 0, 1, 1])

    # get extents of incoming tile and crop accordingly
    ll = mercantile.bounds(i, j, zoom)

    _epsg_x_min, _epsg_y_min = EPSG3857(*ll[:2])
    _epsg_x_max, _epsg_y_max = EPSG3857(*ll[2:])
        
    # set x/y limits to match available tile extents
    ax.set_xlim(_epsg_x_min,_epsg_x_max)
    ax.set_ylim(_epsg_y_min, _epsg_y_max)

    # convert image into base64 encoded string
    dpi = 256
    with io.BytesIO() as out_img:
        fig.savefig(out_img, format='png', dpi=dpi, pad_inches=0.0, transparent=True)
        out_img.seek(0)
        encoded_img = base64.b64encode(out_img.read()).decode('utf-8')

    return encoded_img

    
    