#!/usr/bin/env python3
import os
import re
import json
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
DATA_JSON = BASE / 'data' / 'photos.json'

FOLDERS = {
    'portraiture': ('portraiture', 'portraiture'),
    'Product': ('Product', 'product'),
    'Food': ('Food', 'food'),
    'Moment': ('Moment', 'moment'),
    'Personal Works': ('Personal Works', 'personalwork')
}

IMG_EXTS = ('.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif')

def list_images(folder: Path):
    return [p for p in sorted(folder.iterdir()) if p.is_file() and p.suffix.lower() in IMG_EXTS]

def sort_key_for_resequence(p: Path, prefix: str):
    # If filename matches prefixNN, sort by that number first; else by mtime
    m = re.match(rf'^{re.escape(prefix)}(\d{{2}})\.', p.name, re.IGNORECASE)
    if m:
        return (0, int(m.group(1)), 0)
    else:
        return (1, 0, p.stat().st_mtime)

def resequence_folder(folder_name: str, prefix: str):
    folder = BASE / folder_name
    if not folder.exists():
        return []

    files = list_images(folder)
    files.sort(key=lambda p: sort_key_for_resequence(p, prefix))

    # Prepare target names
    targets = []
    for i, p in enumerate(files, start=1):
        targets.append((p, f"{prefix}{i:02d}{p.suffix.lower()}"))

    # First pass: move to temp names to avoid collisions
    tmp_map = []
    for idx, (src, tgt) in enumerate(targets):
        if src.name == tgt:
            tmp_map.append((src, src))
            continue
        tmp_name = folder / f"._renum_tmp_{idx}{src.suffix.lower()}"
        src.rename(tmp_name)
        tmp_map.append((tmp_name, folder / tgt))

    # Second pass: move tmp to final
    for tmp, final in tmp_map:
        if tmp == final:
            continue
        if final.exists():
            final.unlink()
        tmp.rename(final)

    return [Path(t).stem for (_, t) in [(None, str(x[1])) for x in tmp_map]] if tmp_map else [p.stem for p in files]

def update_photos_json(new_map):
    if not DATA_JSON.exists():
        print('photos.json not found, skipping update')
        return
    with open(DATA_JSON, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Clean up any legacy 'portrait' key that may have been introduced
    if 'portrait' in data:
        del data['portrait']

    for cat_key, arr in new_map.items():
        # arr is dict with 'json_key' and 'list'
        json_key = arr['json_key']
        data[json_key] = arr['list']

    with open(DATA_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def main():
    result = {}
    for folder_name, (folder_display, json_key) in FOLDERS.items():
        folder_path = BASE / folder_display
        if not folder_path.exists():
            continue
        # file prefix: portraiture folder uses 'portrait' prefix for filenames
        if folder_display == 'portraiture':
            prefix = 'portrait'
        else:
            prefix = json_key if json_key != 'personalwork' else 'personalwork'
        # For folder names where json_key differs (Product -> product), prefix is json_key
        new_list = []
        files = list_images(folder_path)
        if not files:
            result[folder_display] = {'json_key': json_key, 'list': []}
            continue
        # Sort and build targets
        files.sort(key=lambda p: sort_key_for_resequence(p, prefix))
        # If files already sequential starting at 01, still ensure names normalized to lowercase ext
        targets = []
        for i, p in enumerate(files, start=1):
            targets.append((p, folder_path / f"{prefix}{i:02d}{p.suffix.lower()}"))

        # rename with temp-first to avoid collisions
        tmp_paths = []
        for idx, (src, tgt) in enumerate(targets):
            if src.name == tgt.name:
                tmp_paths.append((src, tgt))
                continue
            tmp = folder_path / f"._renum_tmp_{idx}{src.suffix.lower()}"
            src.rename(tmp)
            tmp_paths.append((tmp, tgt))

        for tmp, tgt in tmp_paths:
            if tmp.name == tgt.name:
                continue
            if tgt.exists():
                tgt.unlink()
            tmp.rename(tgt)
            new_list.append(tgt.stem)

        if not new_list:
            # no renames performed, just use existing stems (normalized)
            new_list = [p.stem for p in files]

        result[folder_display] = {'json_key': json_key, 'list': new_list}

    # Update photos.json
    update_photos_json(result)
    print('Resequence complete. photos.json updated where applicable.')

if __name__ == '__main__':
    main()
