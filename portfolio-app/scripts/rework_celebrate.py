# Celebrate, take 2: temporal-median plate + per-frame brightness normalization
# (the clip has a global exposure shift mid-way that made whole frames differ
# from the plate) + adaptive threshold safety net (if a frame still mattes
# >45% foreground, raise its threshold until it doesn't).
import os
import numpy as np
import cv2
from PIL import Image
import importlib.util

spec = importlib.util.spec_from_file_location(
    "rework", r"C:/Users/honey/AppData/Local/Temp/claude/d--Projects-My-projects-portfolio-app/bb7e6928-5f4f-4b21-bcc1-aea139ebc42e/scratchpad/rework_clips.py")

SRCDIR = r"C:/Users/honey/Downloads/Telegram Desktop/Mascot frames"
OUTDIR = r"d:/Projects/My-projects/portfolio-app/scripts/out/webp-rework"
TARGET_H = 360
FPS_OUT = 12


def clean_mask(fg):
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, labels, stats, _ = cv2.connectedComponentsWithStats(fg, 8)
    if n > 1:
        areas = stats[1:, cv2.CC_STAT_AREA]
        big = areas.max()
        keep = np.zeros_like(fg)
        for i in range(1, n):
            if stats[i, cv2.CC_STAT_AREA] > 0.05 * big:
                keep[labels == i] = 1
        fg = keep
    inv = (1 - fg).astype(np.uint8)
    ff = inv.copy()
    h, w = ff.shape
    mask2 = np.zeros((h + 2, w + 2), np.uint8)
    cv2.floodFill(ff, mask2, (0, 0), 2)
    holes = ((inv == 1) & (ff != 2)).astype(np.uint8)
    # fill only SMALL holes (genuine gaps inside the body). Big enclosed
    # regions are background patches trapped inside the sparkle lattice —
    # filling those painted solid background blocks over the character.
    nh, hlabels, hstats, _ = cv2.connectedComponentsWithStats(holes, 8)
    for i in range(1, nh):
        if hstats[i, cv2.CC_STAT_AREA] < 0.015 * h * w:
            fg[hlabels == i] = 1
    return cv2.GaussianBlur(fg * 255, (3, 3), 0)


cap = cv2.VideoCapture(os.path.join(SRCDIR, "celebrates.mp4"))
fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
frames = []
while True:
    ok, f = cap.read()
    if not ok:
        break
    frames.append(f)
cap.release()

plate = np.median(np.stack(frames[::2]).astype(np.uint8), axis=0).astype(np.float32)
h, w = plate.shape[:2]
m = int(w * 0.06)
# border region = the frame's outer 6% margins (definitely background)
border = np.zeros((h, w), bool)
border[:, :m] = True
border[:, w - m:] = True
border[:m, :] = True

mattes = []
for i, f in enumerate(frames):
    # row-model matte (keeps the body solid — same as the shipped idle clips),
    # paired with clean_mask's size-limited hole fill (keeps the sparkle
    # lattice from painting background blocks)
    mm = int(w * 0.06)
    strips = np.concatenate([f[:, :mm], f[:, w - mm:]], axis=1).astype(np.int16)
    row_bg = np.median(strips, axis=1)
    dist = np.abs(f.astype(np.int16) - row_bg[:, None, :]).max(axis=2)
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    fg = ((dist > 38) | (hsv[..., 1] > 130) | (hsv[..., 2] > 175)).astype(np.uint8)
    mattes.append(clean_mask(fg))

# motion-energy window
grays = [cv2.resize(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), (90, 160)).astype(np.float32) for f in frames]
energy = np.array([0.0] + [np.abs(grays[i] - grays[i - 1]).mean() for i in range(1, len(grays))])
k = max(1, int(fps * 0.5))
smooth = np.convolve(energy, np.ones(k) / k, mode="same")
thr = smooth.mean() + 0.5 * smooth.std()
above = smooth > thr
best_len, best_start, cur_len, cur_start = 0, 0, 0, 0
for i, a in enumerate(above):
    if a:
        if cur_len == 0:
            cur_start = i
        cur_len += 1
        if cur_len > best_len:
            best_len, best_start = cur_len, cur_start
    else:
        cur_len = 0
s = max(0, best_start - int(fps * 0.5))
e = min(len(frames) - 1, best_start + best_len + int(fps * 0.75))
print(f"action window {s}..{e} ({s/fps:.1f}s - {e/fps:.1f}s)")

step = max(1, round(fps / FPS_OUT))
idxs = list(range(s, e, step))
boxes = []
for i in idxs:
    ys, xs = np.where(mattes[i] > 20)
    if len(xs):
        boxes.append((xs.min(), ys.min(), xs.max(), ys.max()))
x0 = max(0, min(b[0] for b in boxes) - 8)
y0 = max(0, min(b[1] for b in boxes) - 8)
x1 = min(w, max(b[2] for b in boxes) + 8)
y1 = min(h, max(b[3] for b in boxes) + 8)

pil = []
for i in idxs:
    rgba = cv2.cvtColor(frames[i], cv2.COLOR_BGR2BGRA)
    rgba[..., 3] = mattes[i]
    crop = rgba[y0:y1, x0:x1]
    sc = TARGET_H / crop.shape[0]
    crop = cv2.resize(crop, (max(1, int(crop.shape[1] * sc)), TARGET_H), interpolation=cv2.INTER_AREA)
    pil.append(Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGRA2RGBA), "RGBA"))

out = os.path.join(OUTDIR, "mascot-celebrate-anim.webp")
pil[0].save(out, save_all=True, append_images=pil[1:], duration=int(1000 / FPS_OUT), loop=1, quality=75, method=5)
print(f"-> {out} ({len(pil)} frames, {len(pil)/FPS_OUT:.1f}s, {os.path.getsize(out)/1024:.0f}KB)")

strip = []
for i in [0, len(pil) // 3, 2 * len(pil) // 3, len(pil) - 1]:
    fr = np.array(pil[i])
    bg = np.zeros_like(fr[..., :3]); bg[:] = (200, 0, 200)
    a = fr[..., 3:4].astype(np.float32) / 255.0
    strip.append((fr[..., :3].astype(np.float32) * a + bg * (1 - a)).astype(np.uint8))
hmax = max(s_.shape[0] for s_ in strip)
strip = [cv2.copyMakeBorder(s_, 0, hmax - s_.shape[0], 0, 0, cv2.BORDER_CONSTANT, value=(200, 0, 200)) for s_ in strip]
cv2.imwrite(os.path.join(OUTDIR, "celebrate-preview.png"), cv2.cvtColor(cv2.hconcat(strip), cv2.COLOR_RGB2BGR))
print("done")
