import sys, time
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:4187/"
OUT = r"C:/Users/creat/AppData/Local/Temp"

# nome, largura, (altura viewport so referencia)
VIEWPORTS = [
    ("iphone", 390, 844, 3),      # iPhone 14/15
    ("ipromax", 430, 932, 3),     # iPhone 15 Pro Max
    ("ipad", 820, 1180, 2),       # iPad Air retrato
    ("desktop", 1366, 768, 1),
    ("ultrawide", 1920, 1080, 1),
]

with sync_playwright() as p:
    b = p.chromium.launch()
    for name, w, h, dpr in VIEWPORTS:
        pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=dpr)
        pg.goto(URL, wait_until="networkidle")
        # rolar ate o fim em passos pra disparar TODOS os IntersectionObserver
        total = pg.evaluate("document.body.scrollHeight")
        step = int(h * 0.7)
        y = 0
        while y < total:
            pg.evaluate(f"window.scrollTo(0,{y})")
            pg.wait_for_timeout(120)
            y += step
            total = pg.evaluate("document.body.scrollHeight")
        pg.evaluate("window.scrollTo(0,document.body.scrollHeight)")
        pg.wait_for_timeout(400)
        pg.evaluate("window.scrollTo(0,0)")
        pg.wait_for_timeout(300)
        path = f"{OUT}/rv_{name}.png"
        pg.screenshot(path=path, full_page=True)
        print(f"{name}: {w}px dpr{dpr} -> {path}")
        pg.close()
    b.close()
print("done")
