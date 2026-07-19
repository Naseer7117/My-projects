Maska Bhai — ORIGINAL SOURCE CLIPS (backup, NOT deployed)
==========================================================

Raw AI-generated source .mp4 clips for the Maska Bhai mascot. Kept in the repo
(under assets-src/, NOT public/) so they travel with every `git clone` — no
dependence on one machine's Telegram folder — but are NOT bundled into the
production build / deployed site.

They are NOT loaded by the website. The site loads the processed transparent
WebPs in  public/assets/mascot/  (mascot-*-anim.webp), produced from these
sources via the pipeline in scripts/:
  normalize_clips.py    matte + head-size-normalize -> WebP (run FIRST for any new clip)
  slow_clips.py         playback speed (compounds; reads durations from raw bytes)
  convert_clips.py / convert_variants.py / rework_clips.py   older/one-off passes

SEED-use-this-image-for-all-clips.png is the identity-lock reference — seed
EVERY new AI clip generation with it so Maska Bhai stays on-model.

These are the MASTERS — don't edit. To add/replace a mascot animation: drop the
new source .mp4 here, run the pipeline (see HANDOFF.md §4 "animation clip
pipeline"), and the processed WebP lands in public/assets/mascot/.
