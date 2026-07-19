# Slow every installed mascot clip's playback by FACTOR, by stretching each
# frame's duration. No re-conversion — just re-timing the existing WebPs.
# Run: py -3.12 scripts/slow_clips.py [factor]
#
# NOTE: Pillow CANNOT read WebP frame durations back (it returns None), so we
# read the TRUE per-frame durations straight from the WebP ANMF chunks. This
# also makes the script safe to reason about: it reports the real before/after
# so you can see if you're about to double-apply.
import glob, os, struct, sys
from PIL import Image, ImageSequence

FACTOR = float(sys.argv[1]) if len(sys.argv) > 1 else 1.4
MDIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "assets", "mascot")


def read_durations(path):
    """True per-frame durations (ms) from the WebP ANMF chunks."""
    b = open(path, "rb").read()
    i, durs = 12, []
    while i < len(b) - 8:
        fourcc, size = b[i:i + 4], struct.unpack("<I", b[i + 4:i + 8])[0]
        if fourcc == b"ANMF":
            pl = b[i + 8:i + 8 + size]
            durs.append(pl[12] | (pl[13] << 8) | (pl[14] << 16))  # frame_duration: 3 bytes at offset 12
        i += 8 + size + (size & 1)
    return durs


for path in sorted(glob.glob(os.path.join(MDIR, "*.webp"))):
    im = Image.open(path)
    frames = [f.convert("RGBA") for f in ImageSequence.Iterator(im)]
    src = read_durations(path)
    if not src or len(src) != len(frames):
        src = [int(round(1000 / 12))] * len(frames)  # fallback if parse fails
    durs = [max(1, int(round(d * FACTOR))) for d in src]
    loop = im.info.get("loop", 0)
    frames[0].save(path, save_all=True, append_images=frames[1:],
                   duration=durs, loop=loop, quality=80, method=5, disposal=2)
    after = read_durations(path)
    print(f"{os.path.basename(path):<34} {sum(src)/1000:.1f}s -> {sum(after)/1000:.1f}s  ({after[0] if after else '?'}ms/frame)")
print("done — re-run WILL compound (each run multiplies the CURRENT speed).")
