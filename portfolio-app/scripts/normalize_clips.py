# Normalize v2 — HEAD-WIDTH invariant (per subagent's algorithm):
#   scale each clip so the ROBOT'S HEAD is the same width everywhere (the head
#   is rigid across poses; bbox HEIGHT is not — a crouch/sit has a short bbox).
#   Then anchor each clip by the LOWEST opaque pixel (union over frames) to a
#   fixed baseline: feet-on-line when standing, seat-on-line when seated,
#   airborne frames rise above it for jump. Center on head x-center.
#   PEEK is excluded (authored partly off-edge) — pass through at native scale.
import glob, os
import numpy as np
from PIL import Image, ImageSequence

SRC = r"d:/Projects/My-projects/portfolio-app/public/assets/mascot"
OUT = r"d:/Projects/My-projects/portfolio-app/scripts/out/webp-normalized"
os.makedirs(OUT, exist_ok=True)

CANVAS_W = 260
CANVAS_H = 360
BASELINE_MARGIN = 8          # px under the lowest contact point
STANDING_BODY_FRAC = 0.86    # standing clips should land here (calibration target)
ALPHA_T = 32

ONESHOTS = {
    "mascot-idle-stretch-anim.webp", "mascot-idle-laugh-anim.webp",
    "mascot-jump-anim.webp", "mascot-wave-anim.webp",
    "mascot-highfive-anim.webp", "mascot-celebrate-anim.webp",
    "mascot-sit-down-anim.webp",
}
# clips used to CALIBRATE the head:body ratio — clean full-standing poses only
STANDING_CALIB = {"mascot-idle-anim.webp", "mascot-walk-anim.webp", "mascot-wave-anim.webp"}
PEEK = "mascot-peek-anim.webp"


def frames_rgba(im):
    return [f.convert("RGBA") for f in ImageSequence.Iterator(im)]


def tight_bbox(alpha):
    ys, xs = np.where(alpha > ALPHA_T)
    if not len(ys):
        return None
    return xs.min(), ys.min(), xs.max(), ys.max()


def longest_run(row_mask):
    best = cur = 0
    best_end = 0
    for i, v in enumerate(row_mask):
        if v:
            cur += 1
            if cur > best:
                best, best_end = cur, i
        else:
            cur = 0
    return best, (best_end - best + 1, best_end)  # width, (start,end)


def head_metrics(alpha):
    """Return (head_width, head_center_x) using the widest contiguous opaque
    run in the top 30% of the tight bbox."""
    bb = tight_bbox(alpha)
    if not bb:
        return None
    x0, y0, x1, y1 = bb
    band_bot = y0 + int(0.30 * (y1 - y0 + 1))
    best_w, best_cx = 0, (x0 + x1) / 2
    for y in range(y0, band_bot + 1):
        w, (s, e) = longest_run(alpha[y] > ALPHA_T)
        if w > best_w:
            best_w = w
            best_cx = s + w / 2
    return best_w, best_cx


def clip_measurements(frames):
    heads, cxs, union = [], [], None
    for f in frames:
        alpha = np.array(f)[..., 3]
        hm = head_metrics(alpha)
        if hm:
            heads.append(hm[0]); cxs.append(hm[1])
        bb = tight_bbox(alpha)
        if bb:
            union = bb if union is None else (
                min(union[0], bb[0]), min(union[1], bb[1]),
                max(union[2], bb[2]), max(union[3], bb[3]))
    return (np.median(heads) if heads else 0,
            np.median(cxs) if cxs else CANVAS_W / 2,
            union)


# --- calibrate TARGET_HEAD_WIDTH from standing clips ---
ratios = []
clips = {}
for path in sorted(glob.glob(os.path.join(SRC, "*.webp"))):
    name = os.path.basename(path)
    im = Image.open(path)
    frames = frames_rgba(im)
    durs = [f.info.get("duration", im.info.get("duration", 83)) for f in frames]
    hw, cx, union = clip_measurements(frames)
    clips[name] = (frames, durs, hw, cx, union, im.size)
    if name in STANDING_CALIB:
        body_h = union[3] - union[1] + 1
        ratios.append(hw / body_h)

R = float(np.median(ratios))
TARGET_HEAD_W = R * (STANDING_BODY_FRAC * CANVAS_H)
print(f"head:body ratio R={R:.3f} -> TARGET_HEAD_W={TARGET_HEAD_W:.1f}px\n")

for name, (frames, durs, hw, cx, union, src_size) in clips.items():
    if name == PEEK:
        # pass through: fit source canvas to CANVAS_H, no per-character rescale
        scale = CANVAS_H / src_size[1]
        note = "PEEK passthrough"
    else:
        raw = TARGET_HEAD_W / hw
        # Head detection is noisy on profile/tilted poses (walk/run/climb read
        # a narrower head, inflating their scale). The clean STANDING clips
        # land ~0.83-0.88; clamp everything into that band so a mis-measured
        # profile head can't oversize the robot. The head metric still chooses
        # WITHIN the band (a genuinely-bigger-headed frame lands higher).
        scale = max(0.82, min(0.90, raw))
        note = f"headW {hw:.0f} raw {raw:.2f}"

    lowest_src = union[3]
    baseline_y = CANVAS_H - BASELINE_MARGIN
    out_frames = []
    for f in frames:
        fw, fh = f.size
        sf = f.resize((max(1, round(fw * scale)), max(1, round(fh * scale))), Image.LANCZOS)
        offset_x = round(CANVAS_W / 2 - cx * scale)
        offset_y = round(baseline_y - lowest_src * scale)
        canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
        canvas.alpha_composite(sf, (offset_x, offset_y))
        out_frames.append(canvas)

    loop = 1 if name in ONESHOTS else 0
    outp = os.path.join(OUT, name)
    out_frames[0].save(outp, save_all=True, append_images=out_frames[1:],
                       duration=durs, loop=loop, quality=80, method=5, disposal=2)
    body_frac = (union[3] - union[1] + 1) * scale / CANVAS_H
    print(f"{name:<34} scale {scale:.2f} ({note}), stand-frac {body_frac:.2f}, loop={loop}, {os.path.getsize(outp)/1024:.0f}KB")
print("done")
