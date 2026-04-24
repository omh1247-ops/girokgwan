#!/bin/bash
# 사진 폴더에 파일이 추가되면 자동으로 다음 번호로 이름 변경 + 크기 표준화

BASE="/Users/ommyunghun/Documents/GitHub/girokgwan"

rename_folder() {
  local folder="$1"
  local prefix="$2"
  local path="$BASE/$folder"

  [[ -d "$path" ]] || return

  while IFS= read -r -d '' file; do
    filename=$(basename "$file")
    ext="${filename##*.}"
    ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

    # 이미지 파일만 처리
    [[ "$ext_lower" =~ ^(jpg|jpeg|png|gif|webp|heic|heif)$ ]] || continue

    # 이미 올바른 이름이면 건너뜀 (예: portrait01.jpg)
    [[ "$filename" =~ ^${prefix}[0-9]+\.jpg$ ]] && continue

    # 다음 빈 번호 찾기
    n=1
    while [[ -f "$path/${prefix}$(printf '%02d' $n).jpg" ]]; do
      ((n++))
    done

    new_name="${prefix}$(printf '%02d' $n).jpg"
    mv "$file" "$path/$new_name"
    echo "$(date '+%Y-%m-%d %H:%M:%S') 이름 변경: $filename → $new_name" >> "$BASE/scripts/rename-log.txt"

  done < <(find "$path" -maxdepth 1 -type f -print0)
}

rename_folder "portraiture"    "portrait"
rename_folder "Product"        "product"
rename_folder "Food"           "food"
rename_folder "Moment"         "moment"
rename_folder "Personal Works" "personalwork"

# 모든 폴더 크기 표준화
echo "📐 사진 크기 표준화 중..." >> "$BASE/scripts/rename-log.txt"
python3 "$BASE/scripts/standardize-sizes.py" >> "$BASE/scripts/rename-log.txt" 2>&1
