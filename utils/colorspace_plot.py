from re import S
from numpy import left_shift, right_shift
import pygame
from time import sleep
from math import ceil, cos, pi, sin

white = (250, 250, 250)
red = (255, 0 ,0)
green = (0, 255, 0)
blue = (0, 0, 255)
black = (0, 0, 0)
bg_color = black
fps = 30

left_shift = 60

# Plot
plot_top_shift = 150
plot_line_thickness = 1
plot_height = 120
plot_width = 256

# Spectrum
factor = 150 # Precision
square_width = 1
square_height = 40
square_amount = round(2*pi*factor)
top_shift = plot_top_shift + 50

# Sliders
slider_top_shift = top_shift + 100
slider_spacing = 60

class Slider():
    def __init__(self):
        self.offset = None
        self.pos = None
        self.selected = False

# Sliders values
class Slide_pos():
    def __init__(self):
        self.m = 1/2
        self.fi = pi/2
        self.a = 1
        self.fun = cos
        
        self.m_slider = Slider()
        self.a_slider = Slider()
        self.fi_slider = Slider()

# Display
display_width = 2*left_shift + square_amount
display_height = plot_height + slider_top_shift + slider_spacing*8

colorspace = [
    (round(255 * i/ square_amount), round(255 * i/ square_amount), round(255 * i/ square_amount))
    for i in range(square_amount + 1)
]

def draw_slider(x, y, width, height, color, slide_pos, slider, screen, action = None, tag = None):
    cur = pygame.mouse.get_pos()
    click = pygame.mouse.get_pressed()
    rect_width = 10
    rect_height = 24
    multiplier_max = 6
    amplitude_max = 1
    fi_max = 6*pi
    font = pygame.font.Font('freesansbold.ttf', 14)

    if not slider.offset:
        slider.offset = (x, y)
        if action == 'amplitude':
            slider.pos = (width + x, y)
        elif action == 'multiplier':
            slider.pos = (x + width/(multiplier_max/slide_pos.m), y)
        elif action == 'fi':
            slider.pos = (x + width/(fi_max/slide_pos.fi), y)
    pygame.draw.rect(screen, color, (x, y, width, height))

    if  x + width > cur[0] > x and (y + height + rect_height/2 > cur[1] > y - rect_height/2 or slider.selected == True):
        if click[0] == 1 and action != None:
            slider.selected = True
            slider.pos = (cur[0], y)
            if action == 'multiplier':
                slide_pos.m = (multiplier_max/width) * (cur[0] - x)
            if action == 'amplitude':
                slide_pos.a = (amplitude_max/width) * (cur[0] - x)
            if action == 'fi':
                slide_pos.fi = (fi_max/width) * (cur[0] - x)
        if click[0] == 0 and action != None:
            slider.selected = False

    if slider.pos:
        pygame.draw.rect(screen, pygame.Color(white), 
                    (
                        slider.pos[0] - rect_width/2,
                        slider.pos[1] - rect_width,
                        rect_width,
                        rect_height
                    ))
    
    if action == 'amplitude':
        if slide_pos.fun is cos:
            fun = 'cos'
        else:
            fun = 'sin'
        n_str = f'{round(slide_pos.a, 2)}{fun}({round(slide_pos.m, 2)}α + {round(slide_pos.fi/pi, 2)}π)'
        text = tag + ' ' + n_str if tag else n_str
        tag_text = font.render(text, True, white)
        screen.blit(tag_text, ((width)/2, y - slider_spacing/2))


def main():
    pygame.init()
    pygame.font.init()
    display = pygame.display.set_mode((display_width, display_height))
    clock = pygame.time.Clock()
    pygame.display.set_caption("Colorspace visualizer")
    
    p1 = Slide_pos()
    p2 = Slide_pos()
    p3 = Slide_pos()
    
    while True:    
        display.fill(bg_color)

        # Red
        for i in range(square_amount):
            pygame.draw.rect(display, pygame.Color(red), 
            (left_shift + i*plot_line_thickness, 
            plot_top_shift - map_red(i/factor, p1.m, p1.fi, p1.a, p1.fun)*plot_height, 
            plot_line_thickness+1, 
            plot_line_thickness+1)
            )
        # Green
        for i in range(square_amount):
            pygame.draw.rect(display, pygame.Color(green), 
            (left_shift + i*plot_line_thickness, 
            plot_top_shift - map_green(i/factor, p2.m, p2.fi, p2.a, p2.fun)*plot_height, 
            plot_line_thickness+1, 
            plot_line_thickness+1)
            )
        # Blue
        for i in range(square_amount):
            pygame.draw.rect(display, pygame.Color(blue), 
            (left_shift + i*plot_line_thickness, 
            plot_top_shift - map_blue(i/factor, p3.m, p3.fi, p3.a, p3.fun)*plot_height, 
            plot_line_thickness+1, 
            plot_line_thickness+1)
            )

        # Color Spectrum
        for i in range(square_amount):
            color = (
                map_red(i/factor, p1.m, p1.fi, p1.a, p1.fun)*plot_height,
                map_green(i/factor, p2.m, p2.fi, p2.a, p2.fun)*plot_height,
                map_blue(i/factor, p3.m, p3.fi, p3.a, p3.fun)*plot_height
            )
            pygame.draw.rect(display, pygame.Color(color, a=255), (left_shift + i*square_width, top_shift, square_width+1, square_height))

        # Red Sliders
        draw_slider(left_shift, slider_top_shift, square_amount, 4, red, p1, p1.a_slider, display, action='amplitude', tag='Red')
        draw_slider(left_shift, slider_top_shift + slider_spacing, square_amount, 4, red, p1, p1.m_slider, display, action='multiplier')
        draw_slider(left_shift, slider_top_shift + 2*slider_spacing, square_amount, 4, red, p1, p1.fi_slider, display, action='fi')
        # Green Sliders
        draw_slider(left_shift, slider_top_shift + 3*slider_spacing, square_amount, 4, green, p2, p2.a_slider, display, action='amplitude', tag='Green')
        draw_slider(left_shift, slider_top_shift + 4*slider_spacing, square_amount, 4, green, p2, p2.m_slider, display, action='multiplier')
        draw_slider(left_shift, slider_top_shift + 5*slider_spacing, square_amount, 4, green, p2, p2.fi_slider, display, action='fi')
        # Blue Sliders
        draw_slider(left_shift, slider_top_shift + 6*slider_spacing, square_amount, 4, blue, p3, p3.a_slider, display, action='amplitude', tag='Blue')
        draw_slider(left_shift, slider_top_shift + 7*slider_spacing, square_amount, 4, blue, p3, p3.m_slider, display, action='multiplier')
        draw_slider(left_shift, slider_top_shift + 8*slider_spacing, square_amount, 4, blue, p3, p3.fi_slider, display, action='fi')     

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                exit(0)
        

        pygame.display.update()
        clock.tick(fps)


def map_red(a, m=1/2, fi=pi/2, amplitude=1, fun=cos):
    return abs(amplitude*fun(m*a + fi))

def map_green(a, m=1/2, fi=pi/2, amplitude=1, fun=cos):
    return abs(amplitude*fun(m*a + fi))

def map_blue(a, m=1/2, fi=pi/2, amplitude=1, fun=cos):
    return abs(amplitude*fun(m*a + fi))

    
if __name__ == '__main__':
    main()