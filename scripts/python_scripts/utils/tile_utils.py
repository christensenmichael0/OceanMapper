import base64
import matplotlib
matplotlib.use('agg')
from matplotlib import pyplot as plt
import io


def get_min_zoom(series):
    if 'MIN_ZOOM' in series:
        min_zoom = series.MIN_ZOOM
    elif 'min_zoom' in series:
        min_zoom = series.min_zoom
    else:
        min_zoom = 0

    return min_zoom

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

def blank_tile(height=256, width=256, dpi=256):
    """
    blank_tile(height=256, width=256, dpi=256)

    create and return a transparent image as a bytes-like object

    Ouput: image represented as a string
    """
    fig, ax = make_tile_figure(height, width, dpi)

    ax.set_frame_on(False)
    ax.set_clip_on(False)
    ax.set_position([0, 0, 1, 1])

    with io.BytesIO() as out_img:
        fig.savefig(out_img, format='png', dpi=dpi, pad_inches=0.0, transparent=True)
        out_img.seek(0)
        encoded_img = base64.b64encode(out_img.read()).decode('utf-8')

    return encoded_img