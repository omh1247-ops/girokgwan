#!/usr/bin/env node
/**
 * 사진 폴더를 감시하고, 파일이 추가/삭제되면 자동으로 01, 02, 03... 순서로 재정렬
 * - 사진 추가: 마지막 번호 다음 숫자로 자동 이름 변경
 * - 사진 삭제: 남은 사진들을 빈 번호 없이 01부터 다시 오름차순 정렬
 * - 압축/리사이즈는 하지 않음, photos.json도 건드리지 않음
 *   (그 부분은 VS Code Copilot Chat에서 "사진업데이트" 입력 시 처리됨)
 * 사용: node watch-rename.js
 */

const fs = require('fs');
const path = require('path');

const BASE = '/Users/ommyunghun/Documents/GitHub/girokgwan';
const FOLDERS = [
  { dir: 'portraiture', prefix: 'portrait' },
  { dir: 'Product', prefix: 'product' },
  { dir: 'Food', prefix: 'food' },
  { dir: 'Moment', prefix: 'moment' },
  { dir: 'Personal Works', prefix: 'personalwork' }
];

const IMAGE_EXT_RE = /^(jpg|jpeg|png|gif|webp|heic|heif)$/i;

const processing = {};
const debounceTimers = {};

console.log('📸 사진 폴더 감시 시작 (추가/삭제 시 자동 재정렬, 압축 없음)...');
console.log(`감시 중인 폴더: ${FOLDERS.map(f => f.dir).join(', ')}\n`);

FOLDERS.forEach(({ dir, prefix }) => {
  const folderPath = path.join(BASE, dir);

  if (!fs.existsSync(folderPath)) {
    console.log(`⚠️  폴더 없음: ${dir}`);
    return;
  }

  processing[dir] = false;

  fs.watch(folderPath, (eventType, filename) => {
    if (!filename || !isImageFile(filename)) return;
    if (processing[dir]) return;

    if (debounceTimers[dir]) clearTimeout(debounceTimers[dir]);
    debounceTimers[dir] = setTimeout(() => {
      reorganizeFolder(folderPath, dir, prefix);
    }, 600);
  });

  reorganizeFolder(folderPath, dir, prefix, true);
});

function isImageFile(filename) {
  const ext = filename.split('.').pop();
  return IMAGE_EXT_RE.test(ext);
}

function getImageFiles(folderPath) {
  return fs.readdirSync(folderPath).filter(isImageFile);
}

function reorganizeFolder(folderPath, dir, prefix, silent = false) {
  processing[dir] = true;
  try {
    const files = getImageFiles(folderPath);
    const pattern = new RegExp(`^${prefix}(\\d+)\\.[a-zA-Z]+$`);

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

    const orderedFiles = [...known.map(k => k.file), ...unknown.map(u => u.file)];
    if (orderedFiles.length === 0) return;

    const targets = orderedFiles.map((file, i) => {
      const ext = file.split('.').pop().toLowerCase();
      const num = String(i + 1).padStart(2, '0');
      return { oldFile: file, newName: `${prefix}${num}.${ext}` };
    });

    const needsRename = targets.filter(t => t.oldFile !== t.newName);

    if (needsRename.length === 0) {
      if (!silent) console.log(`✅ [${dir}] 변경 없음 (이미 01부터 빈틈없이 정렬됨)`);
      return;
    }

    const tempStep = needsRename.map((t, i) => {
      const ext = t.oldFile.split('.').pop();
      const tempName = `__tmp_${Date.now()}_${i}.${ext}`;
      fs.renameSync(path.join(folderPath, t.oldFile), path.join(folderPath, tempName));
      return { tempName, newName: t.newName, oldFile: t.oldFile };
    });

    tempStep.forEach(({ tempName, newName }) => {
      fs.renameSync(path.join(folderPath, tempName), path.join(folderPath, newName));
    });

    console.log(`📌 [${dir}] 재정렬 완료 (${needsRename.length}개 변경):`);
    needsRename.forEach(t => console.log(`   ${t.oldFile} → ${t.newName}`));
    console.log('');
  } catch (err) {
    console.error(`❌ [${dir}] 오류: ${err.message}`);
  } finally {
    setTimeout(() => { processing[dir] = false; }, 300);
  }
}

console.log('ℹ️  감시 중... (Ctrl+C 누르면 종료)\n');