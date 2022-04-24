import colorsys
import numpy as np
from matplotlib.colors import hsv_to_rgb
import matplotlib.pyplot as plt
# from mpl_toolkits import mplot3d

# # green line = lightness
# # blue line = saturation/lightness ?
# # red line = hue
# res = map(lambda x: matplotlib.colors.to_hex(x), palette)
# rgb_colors = palette
# palette = list(res)
# print(rgb_colors)
# specplot(palette, rgb=True)


def invert_rgb_color(r, g, b):
    return (1-r, 1-g, 1-b)


def make_figure(n):
    if n > 1:
        fig = plt.figure(figsize=(1, n))
    else:
        fig = plt.figure()
    return fig


def convert_colors(color_array, c_type):
    h = [0] * len(color_array)
    s = [0] * len(color_array)
    v = [0] * len(color_array)
    c_type = c_type.lower()
    for i, color in enumerate(color_array):
        if c_type == 'rgb':
            h[i], s[i], v[i] = colorsys.rgb_to_hsv(color[0]*255, color[1]*255, color[2]*255)
        elif c_type == 'hex':
            color = color.strip('#')
            (r ,g ,b) = tuple(int(color[i:i+2], 16) for i in (0, 2, 4))
            h[i], s[i], v[i] = colorsys.rgb_to_hsv(r, g, b)
        elif c_type == 'hsl':
            h[i], s[i], v[i] = color
        
        if v[i] > 1:
            v[i] = v[i]/255

    return (h, s, v)


def plot_colors(color_array, ax, type="hsl"):
    # Code taken from https://stackoverflow.com/questions/10787103/2d-hsv-color-space-in-matplotlib
    V, H = np.mgrid[0:1:100j, 0:1:300j]
    S = np.ones_like(V)
    HSV = np.dstack((H,S,V))
    RGB = hsv_to_rgb(HSV)

    ax.imshow(RGB, origin="lower", extent=[0, 360, 0, 1], aspect=150)
    ax.set_xlabel("Hue", fontweight='bold')
    ax.set_ylabel("Value", fontweight='bold')
    ax.set_title("$S_{HSV}=1$")

    h_list, s_list, l_list = convert_colors(color_array, type)

    for i, (h, s, v) in enumerate(zip(h_list, s_list, l_list)):
        # Horrible hack to get the colors typing, don't judge me
        # Transform color space to HSL
        #Plot dot
        ax.plot(h*360, s, 'o', color='white', markersize=3)

        # Plot line between dots
        if i > 0:
            prev_h = h_list[i-1]
            prev_s = s_list[i-1]
            line_color = invert_rgb_color(*colorsys.hsv_to_rgb(h, s, 1))
            ax.plot([prev_h*360, h*360], [prev_s, s], color=line_color , linestyle='--', linewidth=1)
            if i == len(h_list) - 1:
                ax.text(h*360 + 5, s + 0.1, "End", fontsize=8, color="white", fontweight="bold")
                prev_h = h_list[0]
                prev_s = s_list[0]
                ax.plot([prev_h*360 - 5, h*360], [prev_s, s], linestyle=':', linewidth=1)
                
        elif i == 0:
            ax.text(h*360 - 5, s - 0.1, "Start", fontsize=8, color="white", fontweight="bold")


def plot_colors_3d(color_array, ax, type="hsl"):
    ax.set_xlabel('Hue', fontweight='bold')
    ax.set_ylabel('Saturation', fontweight='bold')
    ax.set_zlabel('Lightness', fontweight='bold')
    ax.set_title('HSL Color Space')
    ax.set_xlim(0, 360)
    ax.set_ylim(0, 1)
    ax.set_zlim(0, 1)
    ax.set_xticks([0, 60, 120, 180, 240, 300, 360])
    ax.set_yticks([0, 0.25, 0.5, 0.75, 1])
    ax.set_zticks([0, 0.25, 0.5, 0.75, 1])
    # ax.grid(False)

    h_list, s_list, l_list = convert_colors(color_array, type)

    for i, (x, y, z) in enumerate(zip(h_list, s_list, l_list)):
        #Plot dot
        ax.plot3D(x*360, y, z, 'o', color=colorsys.hsv_to_rgb(x, y, z), markersize=3)

        # Plot line between dots
        if i > 0:
            prev_x = h_list[i-1]
            prev_y = s_list[i-1]
            prev_z = l_list[i-1]
            ax.plot3D([prev_x*360, x*360], [prev_y, y], [prev_z, z], color=colorsys.hsv_to_rgb(x, y, z) , linestyle='--', linewidth=1)
            if i == len(h_list) - 1:
                ax.text(x*360 + 5, y+0.1, z, "End", (1, 1, 0),fontsize=8, color="black", fontweight="bold")
                prev_x = h_list[0]
                prev_y = s_list[0]
                prev_z = l_list[0]
                ax.plot3D([prev_x*360, x*360], [prev_y, y], [prev_z, z], linestyle=':', linewidth=1)

        elif i == 0:
            ax.text(x*360 - 5, y-0.1, z, "Start", (1, 1, 0), fontsize=8, color="black", fontweight="bold")

    ax.view_init(45, -90)


def plot(palette, color_type, plot_type):
    color_type = color_type.lower()
    plot_type = plot_type.lower()
    assert color_type in ['rgb', 'hex', 'hsl']
    assert plot_type in ['2d', '3d', 'both']
    

    if plot_type == 'both':
        fig = make_figure(2)
        ax = fig.add_subplot(1, 2, 1)
        plot_colors(palette, ax, color_type)
        ax = fig.add_subplot(1, 2, 2, projection='3d')
        plot_colors_3d(palette, ax, color_type)
    else:
        fig = make_figure(1)
        if plot_type == '2d':
            ax = fig.add_subplot(1, 1, 1)
            plot_colors(palette, ax, color_type)
        elif plot_type == '3d':
            ax = fig.add_subplot(1, 1, 1, projection='3d')
            plot_colors_3d(palette, ax, color_type)
    plt.show()

# Example usage
import seaborn as sns
# palette = sns.color_palette('Spectral', 300)
palette = [
"#193737",
"#1b383b",
"#1c393e",
"#1e3a41",
"#1f3b44",
"#213c47",
"#223d4a",
"#233e4d",
"#243f50",
"#264052",
"#274155",
"#284257",
"#294359",
"#2a435c",
"#2b445e",
"#2c4560",
"#2d4662",
"#2e4764",
"#2f4866",
"#304868",
"#31496a",
"#324a6c",
"#334b6e",
"#344c70",
"#344c72",
"#394d72",
"#454b70",
"#50496e",
"#59486b",
"#614669",
"#694466",
"#704363",
"#774161",
"#7d3f5e",
"#843d5b",
"#893b58",
"#8f3955",
"#943752",
"#9a354e",
"#9f324b",
"#a33047",
"#a82d44",
"#ad2b3f",
"#b1283b",
"#b62536",
"#ba2131",
"#be1d2b",
"#c21925",
"#c6141d",
"#ca0c11",
"#cd1706",
"#cf2808",
"#d03309",
"#d23c0a",
"#d4440b",
"#d54b0c",
"#d7520d",
"#d9580e",
"#da5d0f",
"#dc630f",
"#dd6810",
"#df6c11",
"#e17111",
"#e27512",
"#e47a13",
"#e57e13",
"#e78214",
"#e88614",
"#ea8915",
"#eb8d15",
"#ed9116",
"#ee9416",
"#f09817",
"#f19b17",
"#f39e18",
"#ef9d19",
"#ea9a1b",
"#e5971d",
"#e0941f",
"#db9120",
"#d58e22",
"#d08b23",
"#ca8725",
"#c48426",
"#be8127",
"#b87d28",
"#b1792a",
"#aa762b",
"#a3722c",
"#9c6e2d",
"#94692e",
"#8c652f",
"#836130",
"#7a5c31",
"#6f5732",
"#645133",
"#584c34",
"#494535",
"#373f36",
"#193737",
]
plot(palette, 'hex', 'both')

import matplotlib
from colorspace import specplot
# res = map(lambda x: matplotlib.colors.to_hex(x), palette)
# palette = list(res)
specplot(palette, rgb=True)

## Info
# # green line = luminance?
# # blue line = chroma?
# # red line = hue