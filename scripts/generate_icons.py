import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('public', exist_ok=True)

def create_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Outer margin
    pad = int(size * 0.05)
    r = int(size * 0.22)
    
    # Rounded dark obsidian background
    draw.rounded_rectangle(
        [pad, pad, size - pad, size - pad],
        radius=r,
        fill=(15, 18, 28, 255),
        outline=(59, 130, 246, 220),
        width=max(1, int(size * 0.04))
    )
    
    # Inner neon cyan/blue geometric monogram "N"
    w = size - 2 * pad
    h = size - 2 * pad
    
    x1 = pad + int(w * 0.26)
    x2 = pad + int(w * 0.74)
    y1 = pad + int(h * 0.24)
    y2 = pad + int(h * 0.76)
    stroke = max(2, int(size * 0.12))
    
    # Left vertical leg
    draw.line([(x1, y1), (x1, y2)], fill=(0, 240, 255, 255), width=stroke)
    
    # Diagonal
    draw.line([(x1, y1), (x2, y2)], fill=(37, 99, 235, 255), width=stroke)
    
    # Right vertical leg
    draw.line([(x2, y1), (x2, y2)], fill=(0, 240, 255, 255), width=stroke)
    
    # Small dot / dot indicator for Q
    dot_r = max(1, int(size * 0.05))
    dot_x = pad + int(w * 0.82)
    dot_y = pad + int(h * 0.82)
    draw.ellipse([dot_x - dot_r, dot_y - dot_r, dot_x + dot_r, dot_y + dot_r], fill=(0, 240, 255, 255))
    
    img.save(f'public/icon-{size}.png', 'PNG')
    print(f'Generated public/icon-{size}.png')

for s in [16, 32, 48, 128]:
    create_icon(s)

