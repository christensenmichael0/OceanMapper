import boto3
import numpy as np
# import matplotlib
# matplotlib.use('agg')
from matplotlib import pyplot as plt, cm, ticker
import io
import base64
s3 = boto3.client('s3')

def build_legend_image(params):
    """
    build_legend_image(params)

    Create a legend image and returns it as a bas64encoded string
    -----------------------------------------------------------------------
    Inputs:

    params (obj): an object containing params detailing the specific information necessary
        to build the colorbar
    -----------------------------------------------------------------------
    Ouput: base64 encoded image converted to a utf-8 string
    -----------------------------------------------------------------------
    Author: Michael Christensen
    Date Modified: 03/14/2019
    """

    bucket_name = 'oceanmapper-data-storage'

    color_map = params['color_map']
    data_range = [float(val) for val in params['data_range'].split(',')]
    interval = float(params['interval'])
    label = params['label']

    range_val = np.ptp(data_range, axis=0)
    nlvls = range_val/interval
    levelsArr = np.arange(np.min(data_range), np.max(data_range) + interval, interval)

    # create a filename 
    legend_filename = 'dynamic_legend_cache/{}_{:{prec}}_{:{prec}}_{:{prec}}_legend.png'.format(
        color_map, data_range[0], data_range[1], interval, prec='.3f')

    # create some fake data
    extraExtension = range_val/20.0
    sampl = np.random.uniform(low=np.min(data_range) - extraExtension, 
        high=np.max(data_range) + extraExtension, size=(100,100))

    FIGSIZE = (3.5,3.5)
    fig, ax = plt.subplots(figsize=FIGSIZE)
    contourf = ax.contourf(sampl, levels=levelsArr, cmap=cm.get_cmap(color_map), extend='both')

    cbar = plt.colorbar(contourf, orientation='horizontal', extend='both', ax=ax)
    cbar.ax.tick_params(labelsize=7) 
    cbar.ax.set_xlabel(label, size=8)
   
    # remove axes
    ax.remove()

    # convert image into base64 encoded string
    with io.BytesIO() as out_img:
        fig.savefig(out_img, format='png', transparent=True, bbox_inches='tight', pad_inches=0, dpi='figure')
        out_img.seek(0)

        # save in s3 bucket as well for caching
        s3.put_object(Body=out_img, Bucket=bucket_name, Key=legend_filename,
            ACL='public-read')

        out_img.seek(0)
        encoded_img = base64.b64encode(out_img.read()).decode('utf-8')

    return encoded_img
