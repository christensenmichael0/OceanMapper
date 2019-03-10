import numpy as np
import matplotlib as mpl
import matplotlib.pyplot as plt
from matplotlib import cm
import io
import boto3

s3 = boto3.client('s3')
bucket_name = 'oceanmapper-data-storage'

cmap_list = ['viridis', 'magma', 'jet', 'rainbow', 'cool']
gradient = np.linspace(0, 1, 256)
gradient = np.vstack((gradient, gradient))

for name in cmap_list:

    fig = plt.figure(frameon=False)
    fig.set_size_inches(4,.25)
    ax = plt.Axes(fig, [0., 0., 1., 1.])
    ax.set_axis_off()
    fig.add_axes(ax)
    ax.imshow(gradient, aspect='auto',cmap=plt.get_cmap(name))
    extent = ax.get_window_extent().transformed(plt.gcf().dpi_scale_trans.inverted())

    # save figure locally
    # filename = 'colorramps/{0}_colorbar.png'.format(name)
    # fig.savefig(filename,format='png', bbox_inches=extent, transparent=True)

    # save the figure to S3
    filename = 'colorramps/{0}_colorbar.png'.format(name)
    with io.BytesIO() as out_img:
        fig.savefig(out_img,format='png', bbox_inches=extent, transparent=True)
        out_img.seek(0)
        s3.put_object(Body=out_img, Bucket=bucket_name, Key=filename,
            ACL='public-read')
