#!/usr/bin/env node
/**
 * 사진 폴더 감시 + 전체 자동 처리
 * - 새 원본 사진 추가: 압축(긴 쪽 1920px, JPEG 80~85%, 최대 800KB) 후 다음 번호로 저장
 * - 사진 삭제: 남은 사진들을 01부터 빈틈없이 재정렬
 * - 위 처리 후 data/photos.json의 해당 카테고리 배열을 자동으로 최신 상태로 덮어씀
 * 사용: node watch-rename.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE = '/Users/ommyunghun/Documents/GitHub/girokgwan';
const PHOTOS_JSON = path.join(BASE, 'data', 'photos.json');

// ⚠️ jsonKey가 실제 data/photos.json 안의 키 이름과 다르면 여기를 맞게 고쳐주세요.
const FOLDERS = [
  { dir: 'portraiture', prefix: 'portrait', jsonKey: 'portraiture' },
  { dir: 'Product', prefix: 'product', jsonKey: 'product' },
  { dir: 'Food', prefix: 'food', jsonKey: 'food' },
  { dir: 'Moment', prefix: 'moment', jsonKey: 'moment' },
  { dir: 'Personal Works', prefix: 'personalwork', jsonKey: 'personalwork' }
];

const IMAGE_EXT_RE = /^(jpg|jpeg|png|gif|webp|heic|heif)$/i;
const IGNORED_FILES = ['.DS_Store'];

const COMPRESS_OPTS = {
  maxDim: 1920,         // 긴 쪽 기준 최대 1920px (비율 유지, sips -Z)
  qualityStart: 85,
  qualityMin: 60,        // 이 밑으로는 화질 깨지니까 더 안 낮춤
  maxBytes: 800 * 1024,  // 800KB
};

const processing = {};
const debounceTimers = {};

console.log('📸 사진 폴더 감시 시작 (추가→압축+이름변경, 삭제→재정렬, photos.json 자동 동기화)...');
console.log(`감시 중인 폴더: ${FOLDERS.map(f => f.dir).join(', ')}\n`);

FOLDERS.forEach(({ dir, prefix, jsonKey }) => {
  const folderPath = path.join(BASE, dir);

  if (!fs.existsSync(folderPath)) {
    console.log(`⚠️  폴더 없음: ${dir}`);
    return;
  }

  processing[dir] = false;
  reorganizeFolder(folderPath, dir, prefix, jsonKey, true);

  fs.watch(folderPath, (eventType, filename) => {
    if (!filename || !isImageFile(filename)) return;
    if (processing[dir]) return; // 우리가 만든 변경에 또 반응하는 것 방지

    if (debounceTimers[dir]) clearTimeout(debounceTimers[dir]);
    debounceTimers[dir] = setTimeout(() => {
      reorganizeFolder(folderPath, dir, prefix, jsonKey);
    }, 600); // 여러 장 한꺼번에 끌어다 놓을 때 한 번만 처리
  });
});

function isImageFile(filename) {
  const ext = filename.split('.').pop();
  return IMAGE_EXT_RE.test(ext);
}

function getImageFiles(folderPath) {
  return fs.readdirSync(folderPath)
    .filter(file => !IGNORED_FILES.includes(file))
    .filter(isImageFile);
}

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(0)}KB`;
}

/**
 * 원본 사진을 압축: 긴 쪽 1920px로 리사이즈 + JPEG 변환
 * 800KB 넘으면 품질을 5%씩 낮춰가며 재시도 (최소 60%까지)
 */
function compressImage(srcPath, destPath) {
  let quality = COMPRESS_OPTS.qualityStart;
  let size;

  while (true) {
    execSync(
      `sips -Z ${COMPRESS_OPTS.maxDim} "${srcPath}" --out "${destPath}" -s format jpeg -s formatOptions ${quality}`,
      { stdio: 'ignore' }
    );
    size = fs.statSync(destPath).size;

    if (size <= COMPRESS_OPTS.maxBytes || quality <= COMPRESS_OPTS.qualityMin) break;
    quality -= 5;
  }

  return size;
}

/**
 * 폴더 전체를 다시 보고:
 * 1) 기존 정상 파일(known) → 이름 그대로 유지
 * 2) 새 원본 파일(unknown) → 압축 + 폴더에 남아있는 파일 중 가장 큰 번호 다음으로 저장
 * 3) photos.json의 해당 카테고리를 최종 상태로 동기화
 */
function reorganizeFolder(folderPath, dir, prefix, jsonKey, silent = false) {
  processing[dir] = true;
  try {
    const files = getImageFiles(folderPath);
    const pattern = new RegExp(`^${prefix}(\d+)\.([a-zA-Z0-9]+)$`);

    const known = [];
    const unknown = [];

    files.forEach(f => {
      const m = f.match(pattern);
      if (m) {
        known.push({ file: f, num: parseInt(m[1], 10) });
      } else {
        const stat = fs.statSync(path.join(folderPath, f));
        unknown.push({ file: f, mtime: stat.mtimeMs });
      }
    });

    known.sort((a, b) => a.num - b.num);
    unknown.sort((a, b) => a.mtime - b.mtime);

    if (known.length === 0 && unknown.length === 0) {
      updatePhotosJson(jsonKey, []);
      return;
    }

    // 기존 known 파일은 이름을 그대로 유지합니다.
    // 2단계: 새 원본 파일 압축 + 다음 번호로 저장
    const nextNum = known.length > 0 ? known[known.length - 1].num + 1 : 1;
    const compressedResults = [];

    unknown.forEach(u => {
      const num = String(nextNum).padStart(2, '0');
      const newName = `${prefix}${num}.jpg`;
      const srcPath = path.join(folderPath, u.file);
      const destPath = path.join(folderPath, newName);

      try {
        const beforeSize = fs.statSync(srcPath).size;
        const afterSize = compressImage(srcPath, destPath);
        fs.unlinkSync(srcPath); // 압축 성공 후에만 원본 삭제
        nextNum++;
        compressedResults.push({ oldFile: u.file, newName, beforeSize, afterSize });
      } catch (err) {
        console.error(`❌ [${dir}] 압축 실패 (${u.file}): ${err.message} — 원본은 그대로 둠`);
      }
    });

    if (compressedResults.length > 0) {
      console.log(`✨ [${dir}] 새 사진 압축 완료 (${compressedResults.length}개):`);
      compressedResults.forEach(r => {
        console.log(`   ${r.oldFile} → ${r.newName} (${formatKB(r.beforeSize)} → ${formatKB(r.afterSize)})`);
      });
    }

    if (compressedResults.length === 0 && !silent) {
      console.log(`✅ [${dir}] 변경 없음`);
    }

    // 3단계: photos.json 동기화
    const finalFiles = getImageFiles(folderPath).filter(f => pattern.test(f));
    finalFiles.sort((a, b) => {
      const na = parseInt(a.match(pattern)[1], 10);
      const nb = parseInt(b.match(pattern)[1], 10);
      return na - nb;
    });
    const ids = finalFiles.map(f => f.replace(/\.[a-zA-Z]+$/, ''));
    updatePhotosJson(jsonKey, ids);

    if (!silent) console.log('');
  } catch (err) {
    console.error(`❌ [${dir}] 오류: ${err.message}`);
  } finally {
    setTimeout(() => { processing[dir] = false; }, 400);
  }
}

/**
 * data/photos.json의 해당 카테고리 배열을 최신 상태로 덮어쓴다
 */
function updatePhotosJson(jsonKey, ids) {
  if (!fs.existsSync(PHOTOS_JSON)) {
    console.error(`⚠️  photos.json을 찾을 수 없음: ${PHOTOS_JSON}`);
    return;
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(PHOTOS_JSON, 'utf-8'));
  } catch (err) {
    console.error(`❌ photos.json 파싱 실패: ${err.message}`);
    return;
  }

  if (!(jsonKey in data)) {
    console.error(`⚠️  photos.json에 "${jsonKey}" 키가 없습니다. 스크립트 상단 FOLDERS의 jsonKey 설정을 확인해주세요.`);
    return;
  }

  const before = JSON.stringify(data[jsonKey]);
  const after = JSON.stringify(ids);
  if (before === after) return; // 변경 없으면 파일 안 씀

  data[jsonKey] = ids;
  fs.writeFileSync(PHOTOS_JSON, JSON.stringify(data, null, 2) + '\n');
  console.log(`🗂️  photos.json 업데이트: ${jsonKey} → ${ids.length}개`);
}

console.log('ℹ️  감시 중... (Ctrl+C 누르면 종료)\n');
