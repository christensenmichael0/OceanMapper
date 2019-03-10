import boto3
import numpy as np
# import matplotlib
# matplotlib.use('agg')
from matplotlib import pyplot as plt, cm
import io
import base64

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
    Date Modified: 03/09/2019
    """

    color_map = params['color_map']
    data_range = params['data_range']
    interval = params['interval']
    label = params['label']

    nlvls = 100
    range_val = np.ptp(data_range,axis=0)
    if interval != 'None':
        nlvls = range_val/interval
    else:
        interval = range_val/nlvls 

    # determine number of ticks to use
    num_ticks = range_val/interval
    tick_interval = interval
    while (num_ticks > 5) or (range_val % num_ticks != 0):
        tick_interval += interval
        num_ticks = range_val/tick_interval
    
    # create some fake data
    sampl = np.random.uniform(low=np.min(data_range), high=np.max(data_range), size=(100,100))

    FIGSIZE = (3.5,3.5)

    fig, ax = plt.subplots(figsize=FIGSIZE)
    contourf = ax.contourf(sampl, levels=int(nlvls), cmap=cm.get_cmap(color_map))

    cb_ticks = np.linspace(data_range[0],data_range[1], num_ticks + 1)
    cb_ticks_labels = [str(tick) for tick in cb_ticks]
    # cb_ticks_labels[-1] = cb_ticks_labels[-1] + '+'

    cbar = plt.colorbar(contourf, ticks=cb_ticks, orientation='horizontal', ax=ax)
    cbar.ax.set_xlabel(label)

    # update the tick labels
    cbar.ax.set_xticklabels(cb_ticks_labels)
    
    # remove axes
    ax.remove()

    # convert image into base64 encoded string
    with io.BytesIO() as out_img:
        fig.savefig(out_img, format='png', transparent=True, bbox_inches='tight', pad_inches=0)
        out_img.seek(0)
        encoded_img = base64.b64encode(out_img.read()).decode('utf-8')

    return encoded_img
