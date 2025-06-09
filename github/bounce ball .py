import pygame
import sys

pygame.init()


screen_width, screen_height = 800, 600
screen = pygame.display.set_mode((screen_width, screen_height))
pygame.display.set_caption("Bouncing Ball")


ball_radius = 20
ball_color = (255, 0, 0)
ball_x, ball_y = screen_width // 2, screen_height // 2
ball_speed_x, ball_speed_y = 5, 5

while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()


    ball_x += ball_speed_x
    ball_y += ball_speed_y

    if ball_x <= 0 or ball_x >= screen_width:
        ball_speed_x *= -1
    if ball_y <= 0 or ball_y >= screen_height:
        ball_speed_y *= -1

    
    screen.fill((0, 0, 0))
    pygame.draw.circle(screen, ball_color, (ball_x, ball_y), ball_radius)
    pygame.display.flip()
    pygame.time.Clock().tick(60)



