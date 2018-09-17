import boto3
import pickle
import datetime
import numpy as np
import mercantile
import pyproj
from scipy import interpolate
import matplotlib
matplotlib.use('agg')
from matplotlib import pyplot as plt, cm
import matplotlib.colors as colors
import cmocean
import copy
import io
import os
import PIL
import pyproj

s3 = boto3.client('s3')

def lambda_handler(event, context):
    """
    This function creates tiles (.png) and saves them in S3
    -----------------------------------------------------------------------
    Inputs:

    event: AWS Lambda uses this parameter to pass in event data to the handler. 
    This parameter is usually of the Python dict type. It can also be list, str, int, float, or NoneType type.
    In this case the event contains these keys: 
    'pickle_filepath': (string) the location of the pickle data file
    'data_type': (string) - one of 'wind_speed', 'current_speed', 'wave_height', 'wave_period'
    'bucket_name': (string) the name of the S3 bucket ('oceanmapper-data-storage')
    'output_tilepath': (string) - the location where the file will be saved on S3
    'xyz_info': the start and end indx of the tiles to be processed from the mercantile generator
    'zoom_array': (array) the zoom levels to make tiles for
        *(http://www.maptiler.org/google-maps-coordinates-tile-bounds-projection/)
    
    context: AWS Lambda uses this parameter to provide runtime information to your handler. 
    This parameter is of the LambdaContext type.
    -----------------------------------------------------------------------
    Output: A .png files are saved to S3
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 08/19/2018
    """

    # config object
    cmap_config = {
        'wind_speed': {'color_map': cm.get_cmap('viridis'), 'data_range': [0,25]},
        'current_speed': {'color_map': cm.get_cmap('magma'), 'data_range': [0,2]},
        'wave_amp': {'color_map': cm.get_cmap('plasma'), 'data_range': [0,10]},
        'wave_dir': {'color_map': None, 'data_range': [None, None]}
    }

    # get event paramaters
    bucket_name = event['bucket_name']
    pickle_filepath = event['pickle_filepath']
    data_type = event['data_type']
    output_tilepath = event['output_tilepath']
    zoom_array = event['zoom_array']
    start_indx = event['xyz_info']['start_indx']
    end_indx = event['xyz_info']['end_indx']

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

    # plot entire image on 256 by 256 image then crop to tile extents
    if data_type == 'wind_speed' or data_type == 'current_speed':
        fig, ax = make_tile_figure()

        u_vel = (data['u_vel'][keep_lat_indx,:]).astype('float64')
        v_vel = (data['v_vel'][keep_lat_indx,:]).astype('float64')

        data_array = np.sqrt((u_vel**2) + (v_vel**2))

        nlvls = 100
        lvls = np.linspace(cmin, cmax, nlvls)

        ## filled contour (use SORTED indexes for the EPSG3857 drawing surface)
        contourf = ax.contourf(proj_lon_array, proj_lat_array, data_array[sa,:][:,so], 
            levels=lvls, cmap=data_cmap)

        ax.set_frame_on(False)
        ax.set_clip_on(False)
        ax.set_position([0, 0, 1, 1])
    elif data_type == 'wave_amp':
        fig, ax = make_tile_figure()

        height_raw = data['sig_wave_height'][keep_lat_indx,:]
        
        palette = copy.copy(data_cmap)
        palette.set_bad(alpha = 0.0)
        # ax.pcolormesh(proj_lon_array, proj_lat_array, height_raw, shading='flat', cmap=palette,
        # norm=colors.BoundaryNorm([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],ncolors=palette.N))

        ax.contourf(proj_lon_array, proj_lat_array, height_raw[sa,:][:,so], cmap=palette,
        levels=range(16))

        ax.set_frame_on(False)
        ax.set_clip_on(False)
        ax.set_position([0, 0, 1, 1])
    elif data_type == 'wave_dir':
        dir_raw = data['primary_wave_dir'][keep_lat_indx,:]
        #directions are in degrees already
        dir_array = dir_raw[sa,:][:,so]
        
        # convert directions into u,v constituents (use unit vector)
        mag_array = np.ones_like(dir_array)
        u_comp,v_comp = md2uv(mag_array, dir_array,'from')

        # TODO: if interpolation is needed in the future see this resource:
        # http://christopherbull.com.au/python/scipy-interpolate-griddata/
        figure_container = {}
        for zoom in zoom_array:
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

            # create separate figures for dif zooms (for wave direction)
            fig_container, ax_container = make_tile_figure()

            quiver = ax_container.quiver(proj_lon_array[::row_int,::col_int], proj_lat_array[::row_int,::col_int], 
            u_comp[::row_int,::col_int], v_comp[::row_int,::col_int], headwidth=9.0,headlength=8.5, headaxislength=8.0,
            scale_units='width', scale=17.0)

            ax_container.set_frame_on(False)
            ax_container.set_clip_on(False)
            ax_container.set_position([0, 0, 1, 1])

            figure_container[zoom] = fig_container
    else:
        pass   

    # get list of all tiles for certain geographic extents and zooms
    tiles_gen = mercantile.tiles(west=lon.min(), south=lat.min(), east=lon.max(), north=lat.max(), zooms=zoom_array)
    tiles = [tile for tile in tiles_gen]

    for tile_indx in range(start_indx,end_indx):
        tile = tiles[tile_indx]
        
        i,j,zoom=[*tile]
        ll = mercantile.bounds(i, j, zoom)

        _epsg_x_min, _epsg_y_min = EPSG3857(*ll[:2])
        _epsg_x_max, _epsg_y_max = EPSG3857(*ll[2:])

        # if working with wave direction data pick correct figure/axes for particular zoom
        if data_type == 'wave_dir':
            fig = figure_container[zoom]
            ax = fig.gca()
            
        # set x/y limits to match available tile extents
        ax.set_xlim(_epsg_x_min,_epsg_x_max)
        ax.set_ylim(_epsg_y_min, _epsg_y_max)
        
        if bucket_name is 'local':
            filename = '{0}{1}_{2}_{3}.png'.format(output_tilepath, zoom, i, j)
        else:
            filename = '{0}{1}/{2}/{3}.png'.format(output_tilepath, str(zoom), str(i), str(j))

        # only run during local testing
        dpi=256 # dpi for output tile
        if bucket_name is 'local':
            if not os.path.exists(os.path.dirname(filename)):
                try:
                    os.makedirs(os.path.dirname(filename))
                except OSError as exc: # Guard against race condition
                    if exc.errno != errno.EEXIST:
                        raise

            fig.savefig(filename, dpi=dpi, pad_inches=0.0, transparent=True)
        else:
            # save image to memory and then push to s3
            with io.BytesIO() as out_img:
                fig.savefig(out_img,format='png', dpi=dpi, pad_inches=0.0, transparent=True)
                out_img.seek(0)
                client = boto3.client('s3')
                client.put_object(Body=out_img, Bucket=bucket_name, Key=filename,
                    ACL='public-read')

    # release memory
    fig.clf()
    plt.close()

def md2uv(magnitude, direction, orientation='from'):
    """
    md2uv(magnitude, dir)

    convert magnitude and direction to u and v components
    """

    # convert direction to compass direction
    if orientation == 'toward':
        direction_compass = np.mod(90.0 - direction, 360)
    else:
        direction_compass = np.mod(90.0 - direction + 180, 360)

    #convert directions to radians
    direction_rad = direction_compass * (np.pi/180)

    u_comp = magnitude * np.cos(direction_rad)
    v_comp = magnitude * np.sin(direction_rad)

    return (u_comp,v_comp)

def make_tile_figure(height=256, width=256, dpi=256):
    """
    make_tile_figure(height=256, width=256, dpi=256)

    create a transparent figure with a specified width,
    height, and dpi with no x/y ticks and axis turned off

    Ouput: figure and axes object
    """

    fig = plt.figure(dpi=dpi, facecolor='none', edgecolor='none')
    fig.set_alpha(0)
    fig.set_figheight(height/dpi)
    fig.set_figwidth(width/dpi)
    figax = fig.add_axes([0., 0., 1., 1.], xticks=[], yticks=[])
    figax.set_axis_off()
    
    return fig, figax


if __name__ == "__main__":

    # 'GFS_WINDS/20180725_06/10m/pickle/gfs_winds_20180725_06.pickle'
    # 'WAVE_WATCH_3/20180819_06/pickle/ww3_data_20180819_06.pickle'
    # 'HYCOM_OCEAN_CURRENTS_3D/20180826_00/0m/pickle/hycom_currents_20180826_00.pickle'
    
    event = {
        'pickle_filepath': 'HYCOM_OCEAN_CURRENTS_3D/20180826_00/0m/pickle/hycom_currents_20180826_00.pickle',
        'data_type': 'current_speed',
        'bucket_name': 'oceanmapper-data-storage', 
        'output_tilepath': 'test_tiles',
        'xyz_info': {'start_indx': 0, 'end_indx': 50},
        'zoom_array': [3,4,5]
    }

    context = {}
    lambda_handler(event,context)

    # with open("gfs_winds_20180725_06.pickle", "rb") as f:
    #     data = pickle.load(f)

    # with open("wave_data_good.pickle", "rb") as f:
    #     data = pickle.load(f)

