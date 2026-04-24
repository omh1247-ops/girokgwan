#!/usr/bin/env python3
"""
새로 추가된 사진을 기존 사진과 같은 크기로 자동 조정
"""

from PIL import Image
from pathlib import Path
import os

BASE = Path('/Users/ommyunghun/Documents/GitHub/girokgwan')

# 각 폴더별 표준 크기 (가로 x 세로)
FOLDER_SIZES = {
    'portraiture': (800, 1200),
    'Product': (800, 1200),
    'Food': (1200, 800),
    'Moment': (1200, 800),  # Moment는 가장 많은 비율 기준
    'Personal Works': (800, 1200)
}

def get_existing_files(folder_path):
    """해당 폴더의 jpg 파일 목록 반환"""
    return set(f.name for f in folder_path.glob('*.jpg') if f.is_file())

def resize_to_standard(image_path, target_width, target_height):
    """이미지를 표준 크기로 리사이즈"""
    try:
        img = Image.open(image_path)
        
        # 원본 크기
        orig_w, orig_h = img.size
        
        # 비율을 유지하면서 리사이즈
        img.thumbnail((target_width, target_height), Image.Resampling.LANCZOS)
        
        # 배경 생성 (검은색)
        background = Image.new('RGB', (target_width, target_height), (255, 255, 255))
        
        # 중앙 정렬로 붙이기
        offset = (
            (target_width - img.width) // 2,
            (target_height - img.height) // 2
        )
        background.paste(img, offset)
        
        # 저장
        background.save(image_path, 'JPEG', quality=75, optimize=True)
        
        return True, f"{orig_w}x{orig_h} → {target_width}x{target_height}"
    except Exception as e:
        return False, str(e)

def process_folder(folder_name):
    """폴더의 새로운 파일 처리"""
    folder_path = BASE / folder_name
    if not folder_path.exists():
        return []
    
    target_w, target_h = FOLDER_SIZES.get(folder_name, (800, 1200))
    
    files = sorted([f for f in folder_path.glob('*.jpg') if f.is_file()])
    results = []
    
    for filepath in files:
        img = Image.open(filepath)
        current_w, current_h = img.size
        
        # 크기가 다르면 조정
        if abs(current_w - target_w) > 10 or abs(current_h - target_h) > 10:
            success, msg = resize_to_standard(filepath, target_w, target_h)
            if success:
                results.append((filepath.name, msg, True))
            else:
                results.append((filepath.name, msg, False))
        else:
            results.append((filepath.name, f"이미 표준 크기 ({current_w}x{current_h})", None))
    
    return results

def main():
    print("📐 사진 크기 자동 조정\n")
    
    any_changed = False
    
    for folder_name in FOLDER_SIZES.keys():
        folder_path = BASE / folder_name
        if not folder_path.exists():
            continue
        
        results = process_folder(folder_name)
        
        if not results:
            continue
        
        print(f"📁 {folder_name}")
        for filename, msg, status in results:
            if status is True:
                print(f"  ✅ {filename}: {msg}")
                any_changed = True
            elif status is False:
                print(f"  ❌ {filename}: {msg}")
            else:
                print(f"  ℹ️  {filename}: {msg}")
        print()
    
    if any_changed:
        print("✨ 크기 조정 완료!")
    else:
        print("ℹ️  모든 사진이 표준 크기입니다.")

if __name__ == '__main__':
    main()
