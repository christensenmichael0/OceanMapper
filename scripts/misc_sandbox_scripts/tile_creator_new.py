import boto3
import pickle
import datetime
import time
import numpy as np
import mercantile
import pyproj
from scipy import interpolate
from matplotlib import pyplot as plt, cm
import matplotlib.colors as colors
import cmocean
import copy
import io
import os
import PIL
import pyproj

cmap_config = {
    'wind_speed': {'color_map': cm.get_cmap('rainbow'), 'data_range': [0,25]},
    'current_speed': {'color_map': cmocean.cm.speed, 'data_range': [0,2]},
    'wave_amp': {'color_map': cm.get_cmap('rainbow'), 'data_range': [0,10]},
    'wave_dir': {'color_map': None, 'data_range': [None, None]}
}

#def build_tiles(data_struct, data_type, bucket_name, output_file_path, zoom_array=range(4,5)):
def lambda_handler(event, context):
    """
    build_tiles(data_struct, data_type, bucket_name, output_file_path, zoom_array=range(4,9)):

    This function creates tiles (.png) and saves them in S3
    -----------------------------------------------------------------------
    Inputs:

    data_struct: (object) - an object containing latitude, longitude, data, level, and datetime information
    i.e. {'lat': lat_trim, 'lon': lon_ordered, 'u_vel': u_data_cleaned, 'v_vel': v_data_cleaned,
        'datetime': '20180828_00', 'level': '10m'}
    
    data_type: (string) - one of 'wind_speed', 'current_speed', 'wave_height', 'wave_period'
    bucket_name: (string) the name of the S3 bucket ('oceanmapper-data-storage')
    output_file_path: (string) - the location where the file will be saved on S3
    zoom_array: (array) the zoom levels to make tiles for
        *(http://www.maptiler.org/google-maps-coordinates-tile-bounds-projection/)
    -----------------------------------------------------------------------
    Output: A .png files are saved to S3
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 07/28/2018
    """

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

    for zoom in zoom_array:
        # tile logic (only render tiles where data exists)
        tiles = mercantile.tiles(west=lon.min(), south=lat.min(), east=lon.max(), north=lat.max(), zooms=[zoom])
        
        #TODO: plot entire image on 256 by 256 image then crop to tile extents
        height = 256
        width = 256
        dpi = 256

        fig = plt.figure(dpi=dpi, facecolor='none', edgecolor='none')
        fig.set_alpha(0)
        fig.set_figheight(height/dpi)
        fig.set_figwidth(width/dpi)
        ax = fig.add_axes([0., 0., 1., 1.], xticks=[], yticks=[])
        ax.set_axis_off()

        proj_lon_array = lo[sa,:][:,so]
        proj_lat_array = la[sa,:][:,so]

        data_cmap = cmap_config[data_type]['color_map']
        cmin, cmax = cmap_config[data_type]['data_range']

        if data_type == 'wind_speed' or data_type == 'current_speed':
            u_vel = data['u_vel'][keep_lat_indx,:]
            v_vel = data['v_vel'][keep_lat_indx,:]

            data_array = np.sqrt(u_vel[sa,:][:,so]**2 + v_vel[sa,:][:,so]**2)

            nlvls = 100
            lvls = np.linspace(cmin, cmax, nlvls)

            ## filled contour (use SORTED indexes for the EPSG3857 drawing surface)
            contourf = ax.contourf(proj_lon_array, proj_lat_array, data_array[sa,:][:,so], 
                levels=lvls, cmap=data_cmap)
        elif data_type == 'wave_amp':
            height_raw = data['sig_wave_height'][keep_lat_indx,:]
            
            palette = copy.copy(data_cmap)
            palette.set_bad(alpha = 0.0)
            # ax.pcolormesh(proj_lon_array, proj_lat_array, height_raw, shading='flat', cmap=palette,
            # norm=colors.BoundaryNorm([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],ncolors=palette.N))

            ax.contourf(proj_lon_array, proj_lat_array, height_raw[sa,:][:,so], cmap=palette,
            levels=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15])
        elif data_type == 'wave_dir':
            dir_raw = data['primary_wave_dir'][keep_lat_indx,:]
            #directions are in degrees already
            import pdb; pdb.set_trace()

        else:
            pass   

        #TODO the interval will vary for lat vs lon... figure out the correct interval dynamically

        # for wave directions.. get directions in degrees then find the corresponding u and v for magnitude 1
        # using md2uv... all the vectors will have the same magnitude... for wave we start with directions (make this test_data)
        # wind_abs = data_array
        # wind_dir_trig_to = atan2(u_ms/wind_abs, v_ms/wind_abs) 
        # wind_dir_trig_to_degrees = wind_dir_trig_to * 180/pi ## -111.6 degrees

        # intv=10
        # # add quiver when working with wave height/direction
        # quiver = ax.quiver(proj_lon_array[::intv,::intv], proj_lat_array[::intv,::intv], 
        #     u_vel[sa,:][:,so][::intv,::intv], v_vel[sa,:][:,so][::intv,::intv],
        #     width=.0005, headwidth=4.2, headlength=4, headaxislength=3.8, minlength=0)

        ax.set_frame_on(False)
        ax.set_clip_on(False)
        ax.set_position([0, 0, 1, 1])

        t0 = time.time()
        for tile in tiles:       
            i,j,zoom=[*tile]
            ll = mercantile.bounds(i, j, zoom)

            _epsg_x_min, _epsg_y_min = EPSG3857(*ll[:2])
            _epsg_x_max, _epsg_y_max = EPSG3857(*ll[2:])

            # set x/y limits to match available tile extents
            ax.set_xlim(_epsg_x_min,_epsg_x_max)
            ax.set_ylim(_epsg_y_min, _epsg_y_max)
            
            if bucket_name is 'local':
                filename = '{0}{1}_{2}_{3}.png'.format(output_file_path, zoom, i, j)
            else:
                filename = '{0}/{1}/{2}/{3}.png'.format(output_file_path, zoom, i, j)
            print('working on: ' + filename)

            # only run during local testing
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
                    

        # print timing metrics
        t1 = time.time()
        print(t1-t0, 'seconds for zoom level: ', zoom)

        # release memory
        fig.clf()
        plt.close()

def md2uv(magnitude, direction, orientation='from'):
    """
    md2uv(magnitude, dir)

    convert magnitude and direction to u and v components
    """

    # fig, axes = plt.subplots(111)
    # fig = plt.figure()
    # ax = fig.add_subplot(111)

    # convert direction to compass direction
    direction = np.array([[0.0, 45.0], [90.0, 135.0]])

    if orientation == 'toward':
        direction_compass = np.mod(90.0 - direction, 360)
    else:
        direction_compass = np.mod(90.0 - direction + 180, 360)

    #convert directions to radians
    direction_rad = direction_compass * (np.pi/180)

    # this is just for testing.. it should be passed in as an argument
    magnitude = np.ones_like(direction_compass)

    u_comp = magnitude * np.cos(direction_rad)
    v_comp = magnitude * np.sin(direction_rad)

    # ax.quiver(u_comp[0,0],v_comp[0,0])
    # fig.show()


    # rad = 4.0*atan(1.0)/180. 
    # u_comp = -spd*sin(rad*dir) 
    # v = -spd*cos(rad*dir)
    return (u_comp,v_comp)

if __name__ == "__main__":
    # with open("gfs_winds_20180725_06.pickle", "rb") as f:
    #     data = pickle.load(f)

    with open("wave_data_good.pickle", "rb") as f:
        data = pickle.load(f)

    # datetime_today_floor = datetime.date.today().strftime('%Y%m%d_00')
    # output_file_path = 'test_folder/' + datetime_today_floor + '/10m/tiles/'
    # build_tiles(data, 'wind_speed', 'local', output_file_path, 2)

    # output_file_path = 'test_tiles'
    output_file_path = 'test_tiles_waves'
    # output_file_path = 'GFS_WINDS/20180801_00/10m/tiles/gfs_winds'
    # build_tiles(data, 'wind_speed', 'oceanmapper-data-storage', output_file_path, range(4,5))
    build_tiles(data, 'wave_amp', 'oceanmapper-data-storage', output_file_path, range(4,5))
    # build_tiles(data, 'wave_dir', 'oceanmapper-data-storage', output_file_path, range(4,5))


# with open('wave_data_good.pickle', 'wb') as handle:
#     pickle.dump(raw_data, handle, protocol=pickle.HIGHEST_PROTOCOL)

# with open('wave_data_good.pickle', 'rb') as handle:
#     b = pickle.load(handle)

# import io
# import os

# with open("test.xlsx",'rb') as f:
#     g=io.BytesIO(f.read())   ## Getting an Excel File represented as a BytesIO Object
# temporarylocation="testout.xlsx"
# with open(temporarylocation,'wb') as out: ## Open temporary file as bytes
#     out.write(g.read())                ## Read bytes into file

# ## Do stuff with module/file
# os.remove(temporarylocation) ## Delete file when done




    
    
