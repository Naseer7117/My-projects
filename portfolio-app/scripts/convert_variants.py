# One-shot idle-variant converter (idle-look, idle-stretch):
#  - matte fix: the bright-branch now requires lum > 175 (idle-look's lighter
#    floor sat under 175 and was being unioned into the character by the old
#    lum > 150 branch, keeping the whole background opaque)
#  - motion-energy windowing: instead of loop-similarity (which truncated the
#    stretch before the action), find the contiguous high-motion window (the
#    actual head-turn / stretch), pad it, export as a PLAY-ONCE (loop=1)
#    animation with no crossfade tail (no loop = no seam = no ghosting)
import os
import numpy as np
import cv2
from PIL import Image

# SRCDIR: where the raw AI-generated .mp4 clips live (adjust per batch).
# OUTDIR: staging output — inspect the -preview.png strips, THEN manually copy
# good .webp files into public/assets/mascot/ (these already carry the
# mascot-<state>-anim.webp naming).
SRCDIR = r"C:/Users/honey/Downloads/Telegram Desktop/Mascot frames"
OUTDIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out", "webp-oneshots")
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
    fg = ((dist > DIST_T) | (sat > 130) | (lum > 175)).astype(np.uint8)
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

def action_window(frames, fps):
    """Largest contiguous high-motion window (the actual action), padded."""
    small = [cv2.cvtColor(cv2.resize(f, (90, 160)), cv2.COLOR_BGR2GRAY).astype(np.int16) for f in frames]
    energy = np.array([0] + [np.abs(small[i] - small[i - 1]).mean() for i in range(1, len(small))])
    # smooth over ~0.5s
    k = max(1, int(fps * 0.5))
    kernel = np.ones(k) / k
    smooth = np.convolve(energy, kernel, mode="same")
    thresh = smooth.mean() + 0.5 * smooth.std()
    active = smooth > thresh
    # largest contiguous run
    best_len, best_start, cur_start = 0, 0, None
    for i, a in enumerate(active):
        if a and cur_start is None:
            cur_start = i
        elif not a and cur_start is not None:
            if i - cur_start > best_len:
                best_len, best_start = i - cur_start, cur_start
            cur_start = None
    if cur_start is not None and len(active) - cur_start > best_len:
        best_len, best_start = len(active) - cur_start, cur_start
    s = max(0, best_start - int(fps * 0.5))
    e = min(len(frames) - 1, best_start + best_len + int(fps * 0.75))
    return s, e

def convert_oneshot(name):
    cap = cv2.VideoCapture(os.path.join(SRCDIR, f"{name}.mp4"))
    fps = cap.get(cv2.CAP_PROP_FPS)
    frames = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        frames.append(f)
    cap.release()

    s, e = action_window(frames, fps)
    print(f"{name}: action window {s}..{e} ({s/fps:.1f}s - {e/fps:.1f}s of {len(frames)/fps:.0f}s)")
    step = max(1, round(fps / FPS_OUT))
    idxs = list(range(s, e, step))

    mattes, boxes = {}, []
    for i in idxs:
        a = matte_frame(frames[i])
        mattes[i] = a
        ys, xs = np.where(a > 20)
        if len(xs):
            boxes.append((xs.min(), ys.min(), xs.max(), ys.max()))
    x0 = max(0, min(b[0] for b in boxes) - 8)
    y0 = max(0, min(b[1] for b in boxes) - 8)
    x1 = max(b[2] for b in boxes) + 8
    y1 = max(b[3] for b in boxes) + 8

    pil = []
    for i in idxs:
        rgba = cv2.cvtColor(frames[i], cv2.COLOR_BGR2BGRA)
        rgba[..., 3] = mattes[i]
        crop = rgba[y0:y1, x0:x1]
        sc = TARGET_H / crop.shape[0]
        crop = cv2.resize(crop, (max(1, int(crop.shape[1] * sc)), TARGET_H), interpolation=cv2.INTER_AREA)
        pil.append(Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGRA2RGBA), "RGBA"))

    out = os.path.join(OUTDIR, f"mascot-{name}-anim.webp")
    pil[0].save(out, save_all=True, append_images=pil[1:], duration=int(1000 / FPS_OUT), loop=1, quality=75, method=5)
    kb = os.path.getsize(out) / 1024
    dur_s = len(pil) / FPS_OUT
    print(f"  -> {out} ({len(pil)} frames, {dur_s:.1f}s one-shot, {kb:.0f}KB)")

    strip = []
    for i in [0, len(pil) // 3, 2 * len(pil) // 3, len(pil) - 1]:
        fr = np.array(pil[i])
        bg = np.zeros_like(fr[..., :3]); bg[:] = (200, 0, 200)
        a = fr[..., 3:4].astype(np.float32) / 255.0
        strip.append((fr[..., :3].astype(np.float32) * a + bg * (1 - a)).astype(np.uint8))
    hmax = max(s_.shape[0] for s_ in strip)
    strip = [cv2.copyMakeBorder(s_, 0, hmax - s_.shape[0], 0, 0, cv2.BORDER_CONSTANT, value=(200, 0, 200)) for s_ in strip]
    cv2.imwrite(os.path.join(OUTDIR, f"{name}-preview.png"), cv2.cvtColor(cv2.hconcat(strip), cv2.COLOR_RGB2BGR))
    return out, dur_s

for clip in ["wave", "high-five", "celebrates", "sit-down", "jump", "burst laugh"]:
    convert_oneshot(clip)
print("done")
