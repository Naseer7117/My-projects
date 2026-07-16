# Full conversion: AI-generated dark-bg mascot clips -> transparent animated
# WebP loops. Per frame: v3 row-model matte. Loop point: the frame (2.5-6s in)
# most similar to frame 0, so the loop seam is minimal; remaining seam is
# smoothed by a 3-frame crossfade tail. 12fps, 360px tall, q80.
import os
import numpy as np
import cv2
from PIL import Image

# SRCDIR: where the raw AI-generated .mp4 clips live (adjust per batch).
# OUTDIR: staging output — inspect the -preview.png strips, THEN manually copy
# good .webp files into public/assets/mascot/ as mascot-<state>-anim.webp.
SRCDIR = r"C:/Users/honey/Downloads/Telegram Desktop/Mascot frames"
OUTDIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out", "webp-loops")
os.makedirs(OUTDIR, exist_ok=True)

DIST_T = 38
MARGIN = 0.06
TARGET_H = 360
FPS_OUT = 12

def matte_frame(frame):
    h, w = frame.shape[:2]
    f = frame.astype(np.int16)
    m = int(w * MARGIN)
    strips = np.concatenate([f[:, :m], f[:, -m:]], axis=1)
    row_bg = np.median(strips, axis=1)
    dist = np.abs(f - row_bg[:, None, :]).max(axis=2)
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    sat = hsv[..., 1].astype(np.int16)
    lum = hsv[..., 2].astype(np.int16)
    fg = ((dist > DIST_T) | (sat > 130) | (lum > 150)).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, labels, stats, _ = cv2.connectedComponentsWithStats(fg, 8)
    if n > 1:
        areas = stats[1:, cv2.CC_STAT_AREA]
        biggest = areas.max()
        keep = np.zeros_like(fg)
        for i in range(1, n):
            if stats[i, cv2.CC_STAT_AREA] > biggest * 0.05:
                keep[labels == i] = 1
        fg = keep
    inv = 1 - fg
    ff = inv.copy()
    mask = np.zeros((h + 2, w + 2), np.uint8)
    cv2.floodFill(ff, mask, (0, 0), 0)
    fg = fg | ff
    return cv2.GaussianBlur(fg * 255, (3, 3), 0)

def convert(name):
    path = os.path.join(SRCDIR, f"{name}.mp4")
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    frames = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        frames.append(f)
    cap.release()
    n = len(frames)

    # loop point: frame in [2.5s, 6.5s] most similar to frame 0 (downscaled gray diff)
    ref = cv2.cvtColor(cv2.resize(frames[0], (90, 160)), cv2.COLOR_BGR2GRAY).astype(np.int16)
    lo, hi = int(2.5 * fps), min(int(6.5 * fps), n - 1)
    best, best_d = hi, 1e18
    for i in range(lo, hi):
        g = cv2.cvtColor(cv2.resize(frames[i], (90, 160)), cv2.COLOR_BGR2GRAY).astype(np.int16)
        d = np.abs(g - ref).mean()
        if d < best_d:
            best, best_d = i, d
    print(f"{name}: {n} frames @{fps:.0f}fps, loop 0..{best} ({best/fps:.2f}s, seam diff {best_d:.1f})")

    step = max(1, round(fps / FPS_OUT))
    idxs = list(range(0, best, step))
    # shared bbox across sampled frames so all frames align + one crop
    boxes = []
    mattes = {}
    for i in idxs:
        a = matte_frame(frames[i])
        mattes[i] = a
        ys, xs = np.where(a > 20)
        if len(xs):
            boxes.append((xs.min(), ys.min(), xs.max(), ys.max()))
    x0 = max(0, min(b[0] for b in boxes) - 8)
    y0 = max(0, min(b[1] for b in boxes) - 8)
    x1 = min(frames[0].shape[1], max(b[2] for b in boxes) + 8)
    y1 = min(frames[0].shape[0], max(b[3] for b in boxes) + 8)

    pil_frames = []
    for k, i in enumerate(idxs):
        rgba = cv2.cvtColor(frames[i], cv2.COLOR_BGR2BGRA)
        rgba[..., 3] = mattes[i]
        crop = rgba[y0:y1, x0:x1]
        s = TARGET_H / crop.shape[0]
        crop = cv2.resize(crop, (max(1, int(crop.shape[1] * s)), TARGET_H), interpolation=cv2.INTER_AREA)
        # crossfade the last 3 frames toward frame 0 to hide the loop seam
        tail = len(idxs) - 1 - k
        if tail < 3 and len(pil_frames) > 0:
            w_ = (3 - tail) / 4.0
            first = np.array(pil_frames[0]).astype(np.float32)
            cur = cv2.cvtColor(crop, cv2.COLOR_BGRA2RGBA).astype(np.float32)
            if first.shape == cur.shape:
                cur = cur * (1 - w_) + first * w_
            pil_frames.append(Image.fromarray(cur.astype(np.uint8), "RGBA"))
        else:
            pil_frames.append(Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGRA2RGBA), "RGBA"))

    out = os.path.join(OUTDIR, f"{name}-anim.webp")
    dur = int(1000 / FPS_OUT)
    pil_frames[0].save(out, save_all=True, append_images=pil_frames[1:], duration=dur, loop=0, quality=80, method=4)
    kb = os.path.getsize(out) / 1024
    print(f"  -> {out} ({len(pil_frames)} frames, {kb:.0f}KB)")

    # preview strip: 4 frames on magenta
    strip = []
    for i in [0, len(pil_frames)//3, 2*len(pil_frames)//3, len(pil_frames)-1]:
        fr = np.array(pil_frames[i])
        bg = np.zeros_like(fr[..., :3]); bg[:] = (200, 0, 200)
        a = fr[..., 3:4].astype(np.float32) / 255.0
        strip.append((fr[..., :3].astype(np.float32) * a + bg * (1 - a)).astype(np.uint8))
    cv2.imwrite(os.path.join(OUTDIR, f"{name}-preview.png"), cv2.cvtColor(cv2.hconcat(strip), cv2.COLOR_RGB2BGR))

for clip in ["idle", "idle-look", "idle-stretch"]:
    convert(clip)
print("done")
