#!/usr/bin/env python3
"""
원본 사진 폴더 -> web/ 폴더로 WebP 변환본을 자동 생성/동기화하는 스크립트.
원본 파일은 절대 수정/삭제하지 않음. web/ 쪽에만 새로 쓰거나 갱신함.
"""
import os
import sys
import datetime
from PIL import Image, ImageOps

REPO = "/Users/ommyunghun/Documents/GitHub/girokgwan"
LOG = os.path.join(REPO, ".autopush", "webpsync.log")

CATEGORY_DIRS = ["portraiture", "Artist", "Product", "Food", "Moment", "Personal Works"]
WEB_ROOT = "web"
QUALITY = 82

def log(msg):
    try:
        with open(LOG, "a") as f:
            f.write(f"{datetime.datetime.now():%Y-%m-%d %H:%M:%S} {msg}\n")
    except Exception:
        pass

def convert_one(src_path, dst_path):
    try:
        with Image.open(src_path) as im:
            im = ImageOps.exif_transpose(im)  # EXIF 회전 정보를 실제 픽셀에 반영 (회전 문제 방지)
            if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
                im = im.convert("RGBA")
            else:
                im = im.convert("RGB")
            os.makedirs(os.path.dirname(dst_path), exist_ok=True)
            im.save(dst_path, "WEBP", quality=QUALITY, method=6)
        return True
    except Exception as e:
        log(f"ERROR converting {src_path}: {e}")
        return False

def main():
    os.chdir(REPO)
    converted = 0
    skipped = 0
    for cat_dir in CATEGORY_DIRS:
        if not os.path.isdir(cat_dir):
            continue
        for fn in os.listdir(cat_dir):
            if not fn.lower().endswith((".jpg", ".jpeg")):
                continue
            src_path = os.path.join(cat_dir, fn)
            base_name = os.path.splitext(fn)[0]
            dst_path = os.path.join(WEB_ROOT, cat_dir, base_name + ".webp")

            needs_convert = False
            if not os.path.exists(dst_path):
                needs_convert = True
            else:
                src_mtime = os.path.getmtime(src_path)
                dst_mtime = os.path.getmtime(dst_path)
                if src_mtime > dst_mtime:
                    needs_convert = True

            if needs_convert:
                if convert_one(src_path, dst_path):
                    converted += 1
                    log(f"converted: {src_path} -> {dst_path}")
            else:
                skipped += 1

    if converted:
        log(f"done: {converted} converted, {skipped} already up to date")
    print(f"converted={converted} skipped={skipped}")

if __name__ == "__main__":
    main()
