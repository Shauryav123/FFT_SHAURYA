import os
from PIL import Image, ImageDraw

def create_favicon():
    size = 128
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Gradient squircle background
    # Interpolate colors between #8B5CF6 (139, 92, 246) and #EC4899 (236, 72, 153)
    c1 = (139, 92, 246)
    c2 = (236, 72, 153)

    # Base rounded rectangle mask
    radius = 32
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([4, 4, size - 4, size - 4], radius=radius, fill=255)

    # Draw gradient
    grad = Image.new("RGBA", (size, size))
    grad_draw = ImageDraw.Draw(grad)
    for y in range(size):
        ratio = y / size
        r = int(c1[0] + (c2[0] - c1[0]) * ratio)
        g = int(c1[1] + (c2[1] - c1[1]) * ratio)
        b = int(c1[2] + (c2[2] - c1[2]) * ratio)
        grad_draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    img.paste(grad, (0, 0), mask)

    # Subtle border
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([4, 4, size - 4, size - 4], radius=radius, outline=(255, 255, 255, 70), width=3)

    # Swords Icon points scaled from 24x24 to 128x128
    # Translation (16, 16), scale = 4.0 (24 * 4 = 96; 16 + 96 = 112)
    def pt(x, y):
        return (16 + x * 4.0, 16 + y * 4.0)

    white = (255, 255, 255, 255)
    shadow = (0, 0, 0, 80)
    w = 5

    def draw_swords(offset=(0, 0), color=white):
        ox, oy = offset
        def p(x, y):
            x1, y1 = pt(x, y)
            return (x1 + ox, y1 + oy)

        # Polyline 1
        pts1 = [p(14.5, 17.5), p(3, 6), p(3, 3), p(6, 3), p(17.5, 14.5)]
        for i in range(len(pts1) - 1):
            draw.line([pts1[i], pts1[i+1]], fill=color, width=w)

        # Lines 1
        draw.line([p(13, 19), p(19, 13)], fill=color, width=w)
        draw.line([p(16, 16), p(20, 20)], fill=color, width=w)
        draw.line([p(19, 21), p(21, 19)], fill=color, width=w)

        # Polyline 2
        pts2 = [p(14.5, 6.5), p(18, 3), p(21, 3), p(21, 6), p(17.5, 9.5)]
        for i in range(len(pts2) - 1):
            draw.line([pts2[i], pts2[i+1]], fill=color, width=w)

        # Lines 2
        draw.line([p(5, 14), p(9, 18)], fill=color, width=w)
        draw.line([p(7, 17), p(4, 20)], fill=color, width=w)
        draw.line([p(3, 19), p(5, 21)], fill=color, width=w)

    # Draw shadow first
    draw_swords(offset=(0, 3), color=shadow)
    # Draw foreground
    draw_swords(offset=(0, 0), color=white)

    # Save PNG formats
    out_dir = r"C:\Users\SHAURYA VENKTA\Desktop\FFTProject\decision-duel\public"
    img.save(os.path.join(out_dir, "apple-touch-icon.png"), format="PNG")

    img_32 = img.resize((32, 32), Image.Resampling.LANCZOS)
    img_32.save(os.path.join(out_dir, "favicon-32x32.png"), format="PNG")

    img_16 = img.resize((16, 16), Image.Resampling.LANCZOS)
    img_16.save(os.path.join(out_dir, "favicon-16x16.png"), format="PNG")

    # Save .ico with multi-resolutions
    img.save(os.path.join(out_dir, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("Favicon files generated successfully in public directory!")

if __name__ == "__main__":
    create_favicon()
