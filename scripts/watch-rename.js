#!/usr/bin/env node
/**
 * 사진 폴더를 감시하고 파일이 추가되면 자동으로 이름 변경
 * 사용: node watch-rename.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE = '/Users/ommyunghun/Documents/GitHub/girokgwan';
const FOLDERS = [
  { dir: 'portraiture', prefix: 'portrait' },
  { dir: 'Product', prefix: 'product' },
  { dir: 'Food', prefix: 'food' },
  { dir: 'Moment', prefix: 'moment' },
  { dir: 'Personal Works', prefix: 'personalwork' }
];

const watchedFolders = {};

console.log('📸 사진 폴더 감시 시작...');
console.log(`감시 중인 폴더: ${FOLDERS.map(f => f.dir).join(', ')}\n`);

FOLDERS.forEach(({ dir, prefix }) => {
  const folderPath = path.join(BASE, dir);
  
  if (!fs.existsSync(folderPath)) {
    console.log(`⚠️  폴더 없음: ${dir}`);
    return;
  }

  // 초기 파일 개수 저장
  const files = fs.readdirSync(folderPath).filter(f => isImageFile(f));
  watchedFolders[dir] = new Set(files);

  // 폴더 감시
  fs.watch(folderPath, (eventType, filename) => {
    if (!filename || !isImageFile(filename)) return;

    const filePath = path.join(folderPath, filename);

    // 파일이 실제로 존재하는지 확인 (쓰기 완료 대기)
    setTimeout(() => {
      if (!fs.existsSync(filePath)) return;

      const currentFiles = new Set(
        fs.readdirSync(folderPath).filter(f => isImageFile(f))
      );

      // 새 파일이 추가되었는지 확인
      const newFile = Array.from(currentFiles).find(f => !watchedFolders[dir].has(f));
      
      if (newFile) {
        console.log(`📌 새 파일 감지: ${dir}/${newFile}`);
        renameFile(folderPath, newFile, prefix);
        watchedFolders[dir] = currentFiles;
      }
    }, 500);
  });
});

/**
 * 이미지 파일인지 확인
 */
function isImageFile(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return /^(jpg|jpeg|png|gif|webp|heic|heif)$/.test(ext);
}

/**
 * 파일 이름 변경
 */
function renameFile(folderPath, filename, prefix) {
  const filePath = path.join(folderPath, filename);
  const ext = filename.split('.').pop().toLowerCase();

  // 이미 올바른 이름이면 건너뜀
  if (filename.match(new RegExp(`^${prefix}\\d+\\.${ext}$`))) {
    console.log(`✅ 이미 올바른 이름: ${filename}`);
    return;
  }

  // 다음 빈 번호 찾기
  let n = 1;
  const files = fs.readdirSync(folderPath);
  while (files.includes(`${prefix}${String(n).padStart(2, '0')}.jpg`)) {
    n++;
  }

  const newName = `${prefix}${String(n).padStart(2, '0')}.${ext}`;
  const newPath = path.join(folderPath, newName);

  try {
    fs.renameSync(filePath, newPath);
    const folderName = folderPath.split('/').pop();
    console.log(`✨ 이름 변경: ${filename} → ${newName}`);
    
    // 로그 기록
    const logPath = path.join(BASE, 'scripts', 'rename-log.txt');
    const timestamp = new Date().toLocaleString('ko-KR');
    fs.appendFileSync(logPath, `${timestamp} | ${folderName}/${filename} → ${newName}\n`);
  } catch (err) {
    console.error(`❌ 오류: ${err.message}`);
  }
}

console.log('ℹ️  감시 중... (Ctrl+C 누르면 종료)\n');
