#!/usr/bin/env python3
"""
모든 사진 폴더의 JPG 이미지 압축
- 품질: 75 (충분히 좋은 화질 유지)
- 최대 크기: 1200x1200px
- EXIF 데이터 유지
"""

from PIL import Image
import os
import sys
from pathlib import Path

BASE = Path('/Users/ommyunghun/Documents/GitHub/girokgwan')
FOLDERS = ['portraiture', 'Product', 'Food', 'Moment', 'Personal Works']

QUALITY = 75
MAX_SIZE = 1200
VERBOSE = True

def compress_image(image_path):
    """이미지 압축"""
    try:
        img = Image.open(image_path)
        
        # 원본 크기 저장
        orig_size = os.path.getsize(image_path)
        orig_size_mb = orig_size / (1024 * 1024)
        
        # EXIF 데이터 추출 (회전 정보 등)
        exif_data = None
        if hasattr(img, 'info') and 'exif' in img.info:
            exif_data = img.info['exif']
        
        # 이미지 방향 자동 수정
        if hasattr(img, '_getexif') and img._getexif() is not None:
            from PIL.ExifTags import TAGS
            exif = img._getexif()
            if exif and 274 in exif:  # 274 = Orientation tag
                orientation = exif[274]
                if orientation == 3:
                    img = img.rotate(180, expand=True)
                elif orientation == 6:
                    img = img.rotate(270, expand=True)
                elif orientation == 8:
                    img = img.rotate(90, expand=True)
        
        # 크기 조정 (큰 이미지만)
        if img.width > MAX_SIZE or img.height > MAX_SIZE:
            img.thumbnail((MAX_SIZE, MAX_SIZE), Image.Resampling.LANCZOS)
        
        # 압축 저장
        img.save(image_path, 'JPEG', quality=QUALITY, optimize=True)
        
        new_size = os.path.getsize(image_path)
        new_size_mb = new_size / (1024 * 1024)
        reduction = ((orig_size - new_size) / orig_size * 100)
        
        if VERBOSE:
            print(f"  ✅ {os.path.basename(image_path)}: {orig_size_mb:.2f}MB → {new_size_mb:.2f}MB (-{reduction:.0f}%)")
        
        return True
    except Exception as e:
        print(f"  ❌ 오류: {os.path.basename(image_path)} - {e}")
        return False

def main():
    print("📸 이미지 압축 시작...\n")
    
    total_orig = 0
    total_new = 0
    total_count = 0
    
    for folder in FOLDERS:
        folder_path = BASE / folder
        
        if not folder_path.exists():
            print(f"⚠️  폴더 없음: {folder}")
            continue
        
        files = sorted([f for f in folder_path.glob('*.jpg') if f.is_file()])
        
        if not files:
            print(f"⚠️  JPG 파일 없음: {folder}")
            continue
        
        print(f"📁 {folder} ({len(files)}개 파일)")
        
        for filepath in files:
            orig_size = os.path.getsize(filepath)
            if compress_image(filepath):
                total_count += 1
                total_orig += orig_size
                total_new += os.path.getsize(filepath)
        
        print()
    
    print("="*50)
    if total_count > 0:
        total_orig_mb = total_orig / (1024 * 1024)
        total_new_mb = total_new / (1024 * 1024)
        total_reduction = ((total_orig - total_new) / total_orig * 100)
        print(f"✨ 완료!")
        print(f"   📊 파일 수: {total_count}개")
        print(f"   💾 용량 감소: {total_orig_mb:.2f}MB → {total_new_mb:.2f}MB (-{total_reduction:.0f}%)")
        print(f"   🚀 로딩 속도 향상!")
    else:
        print("❌ 압축할 이미지 없음")

if __name__ == '__main__':
    main()
