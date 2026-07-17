# Rework pass for the problem clips:
#   walk       - row-model matte, MIRRORED (clip faces left, static art faces right), loop
#   dance      - row-model matte, windowed from 1.0s (skips the camera-zoom intro), loop
#   celebrates - TEMPORAL-MEDIAN matte (center-darkened bg beats the row model, but the
#                robot moves enough that a per-pixel median over time = clean bg plate),
#                motion-energy window, one-shot loop=1
#   peek       - green-screen chroma matte (tight hue window so the cyan eye glow
#                survives), MIRRORED (clip is native left-edge, static art right-edge), loop
import os
import numpy as np
import cv2
from PIL import Image

SRCDIR = r"C:/Users/honey/Downloads/Telegram Desktop/Mascot frames"
OUTDIR = r"d:/Projects/My-projects/portfolio-app/scripts/out/webp-rework"
os.makedirs(OUTDIR, exist_ok=True)

DIST_T = 38
MARGIN = 0.06
TARGET_H = 360
FPS_OUT = 12


def read_frames(name, flip=False):
    cap = cv2.VideoCapture(os.path.join(SRCDIR, f"{name}.mp4"))
    fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    frames = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        frames.append(cv2.flip(f, 1) if flip else f)
    cap.release()
    return frames, fps


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
    holes = (inv == 1) & (ff != 2)
    fg[holes] = 1
    return cv2.GaussianBlur(fg * 255, (3, 3), 0)


def row_matte(frame, lum_hi=150):
    h, w = frame.shape[:2]
    m = max(2, int(w * MARGIN))
    strips = np.concatenate([frame[:, :m], frame[:, w - m:]], axis=1).astype(np.int16)
    row_bg = np.median(strips, axis=1)
    dist = np.abs(frame.astype(np.int16) - row_bg[:, None, :]).max(axis=2)
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    fg = ((dist > DIST_T) | (hsv[..., 1] > 130) | (hsv[..., 2] > lum_hi)).astype(np.uint8)
    return clean_mask(fg)


def green_matte(frame):
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    bg = ((hsv[..., 0] >= 45) & (hsv[..., 0] <= 75) & (hsv[..., 1] > 60) & (hsv[..., 2] > 50))
    fg = (~bg).astype(np.uint8)
    return clean_mask(fg)


def despill_green(bgr, alpha):
    b, g, r = cv2.split(bgr.astype(np.int16))
    g2 = np.minimum(g, np.maximum((r + b) // 2, 0))
    out = cv2.merge([b, g2, r]).astype(np.uint8)
    return np.where(alpha[..., None] > 0, out, bgr)


def shared_crop(mattes, shape):
    boxes = []
    for a in mattes:
        ys, xs = np.where(a > 20)
        if len(xs):
            boxes.append((xs.min(), ys.min(), xs.max(), ys.max()))
    x0 = max(0, min(b[0] for b in boxes) - 8)
    y0 = max(0, min(b[1] for b in boxes) - 8)
    x1 = min(shape[1], max(b[2] for b in boxes) + 8)
    y1 = min(shape[0], max(b[3] for b in boxes) + 8)
    return x0, y0, x1, y1


def to_pil(frame, matte, box):
    x0, y0, x1, y1 = box
    rgba = cv2.cvtColor(frame, cv2.COLOR_BGR2BGRA)
    rgba[..., 3] = matte
    crop = rgba[y0:y1, x0:x1]
    sc = TARGET_H / crop.shape[0]
    crop = cv2.resize(crop, (max(1, int(crop.shape[1] * sc)), TARGET_H), interpolation=cv2.INTER_AREA)
    return cv2.cvtColor(crop, cv2.COLOR_BGRA2RGBA)


def find_loop_end(frames, fps, start):
    ref = cv2.resize(cv2.cvtColor(frames[start], cv2.COLOR_BGR2GRAY), (90, 160))
    lo = start + int(2.5 * fps)
    hi = min(start + int(6.5 * fps), len(frames) - 1)
    best, best_d = hi, 1e9
    for i in range(lo, hi):
        g = cv2.resize(cv2.cvtColor(frames[i], cv2.COLOR_BGR2GRAY), (90, 160))
        d = np.abs(g.astype(np.float32) - ref.astype(np.float32)).mean()
        if d < best_d:
            best, best_d = i, d
    print(f"  loop {start}..{best} ({(best-start)/fps:.2f}s, seam diff {best_d:.1f})")
    return best


def encode_loop(name, frames, mattes, fps, start, end, outname):
    step = max(1, round(fps / FPS_OUT))
    idxs = list(range(start, end, step))
    box = shared_crop([mattes[i] for i in idxs], frames[0].shape)
    pil = []
    for k, i in enumerate(idxs):
        rgba = to_pil(frames[i], mattes[i], box)
        tail = len(idxs) - 1 - k
        if tail < 3 and len(pil) > 0:
            w_ = (3 - tail) / 4.0
            first = np.array(pil[0]).astype(np.float32)
            cur = rgba.astype(np.float32)
            if first.shape == cur.shape:
                rgba = (cur * (1 - w_) + first * w_).astype(np.uint8)
        pil.append(rgba)
    pil = [Image.fromarray(p, "RGBA") for p in pil]
    out = os.path.join(OUTDIR, outname)
    pil[0].save(out, save_all=True, append_images=pil[1:], duration=int(1000 / FPS_OUT), loop=0, quality=80, method=4)
    print(f"  -> {out} ({len(pil)} frames, {os.path.getsize(out)/1024:.0f}KB)")
    preview(name, pil)


def encode_oneshot(name, frames, mattes, fps, start, end, outname):
    step = max(1, round(fps / FPS_OUT))
    idxs = list(range(start, end, step))
    box = shared_crop([mattes[i] for i in idxs], frames[0].shape)
    pil = [Image.fromarray(to_pil(frames[i], mattes[i], box), "RGBA") for i in idxs]
    out = os.path.join(OUTDIR, outname)
    pil[0].save(out, save_all=True, append_images=pil[1:], duration=int(1000 / FPS_OUT), loop=1, quality=75, method=5)
    print(f"  -> {out} ({len(pil)} frames, {len(pil)/FPS_OUT:.1f}s one-shot, {os.path.getsize(out)/1024:.0f}KB)")
    preview(name, pil)


def preview(name, pil):
    strip = []
    for i in [0, len(pil) // 3, 2 * len(pil) // 3, len(pil) - 1]:
        fr = np.array(pil[i])
        bg = np.zeros_like(fr[..., :3]); bg[:] = (200, 0, 200)
        a = fr[..., 3:4].astype(np.float32) / 255.0
        strip.append((fr[..., :3].astype(np.float32) * a + bg * (1 - a)).astype(np.uint8))
    hmax = max(s.shape[0] for s in strip)
    strip = [cv2.copyMakeBorder(s, 0, hmax - s.shape[0], 0, 0, cv2.BORDER_CONSTANT, value=(200, 0, 200)) for s in strip]
    cv2.imwrite(os.path.join(OUTDIR, f"{name}-preview.png"), cv2.cvtColor(cv2.hconcat(strip), cv2.COLOR_RGB2BGR))


# ---- walk: mirrored, row matte, loop ----
print("walk (mirrored):")
frames, fps = read_frames("walk", flip=True)
mattes = [row_matte(f) for f in frames]
end = find_loop_end(frames, fps, 0)
encode_loop("walk", frames, mattes, fps, 0, end, "mascot-walk-anim.webp")

# ---- dance: window from 1.0s, row matte, loop ----
print("dance-1 (windowed from 1.0s):")
frames, fps = read_frames("dance-1")
start = int(1.0 * fps)
mattes = [row_matte(f) for f in frames]
end = find_loop_end(frames, fps, start)
encode_loop("dance", frames, mattes, fps, start, end, "mascot-idle-dance-anim.webp")

# ---- celebrates: temporal-median matte, motion window, one-shot ----
print("celebrates (temporal-median matte):")
frames, fps = read_frames("celebrates")
stack = np.stack(frames[::2]).astype(np.uint8)
plate = np.median(stack, axis=0).astype(np.int16)
mattes = []
for f in frames:
    dist = np.abs(f.astype(np.int16) - plate).max(axis=2)
    fg = (dist > 30).astype(np.uint8)
    mattes.append(clean_mask(fg))
# motion-energy window (same approach as convert_variants)
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
print(f"  action window {s}..{e} ({s/fps:.1f}s - {e/fps:.1f}s)")
encode_oneshot("celebrate", frames, mattes, fps, s, e, "mascot-celebrate-anim.webp")

# ---- peek: mirrored, green chroma matte + despill, loop ----
print("peek (mirrored, chroma):")
frames, fps = read_frames("peek", flip=True)
mattes = [green_matte(f) for f in frames]
frames = [despill_green(f, m) for f, m in zip(frames, mattes)]
end = find_loop_end(frames, fps, 0)
encode_loop("peek", frames, mattes, fps, 0, end, "mascot-peek-anim.webp")

print("done")
