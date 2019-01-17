from pylab import *

# viridis
# magmga
cmap = cm.get_cmap('Greys', 5)    # PiYG

for i in range(cmap.N):
    rgb = cmap(i)[:3] # will return rgba, we take only first 3 so we get rgb
    print(matplotlib.colors.rgb2hex(rgb))