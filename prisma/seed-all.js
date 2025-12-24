#!/usr/bin/env node
/**
 * 모든 시드 파일을 순차적으로 실행하는 통합 스크립트
 * 사용법: node prisma/seed-all.js
 */

const { execSync } = require('child_process');
const path = require('path');

const seedFiles = [
    'seed.js',           // 기본 Admin 사용자 및 시스템 설정
    'seed-admin.ts',     // 관리자 설정
    'seed-models.ts',    // AI 모델 설정
    'seed-cost.ts',      // 비용 설정
    'seed-deployments.ts', // 배포 설정
    'seed-knowledge.ts', // 지식 문서
    'seed-notebook-admin.ts', // 노트북 관리 정책 및 파이프라인
    'seed-policies.ts',  // 거버넌스 정책
    'seed-policies-data.ts', // 거버넌스 정책 데이터
    'seed-quality-data.ts', // 품질 데이터
    'seed-usage-data.ts', // 사용량 로그 및 예산
];

async function runAllSeeds() {
    console.log('🌱 모든 시드 데이터 입력을 시작합니다...\n');

    const results = [];

    for (const file of seedFiles) {
        const filePath = path.join(__dirname, file);
        const isTypeScript = file.endsWith('.ts');

        console.log(`📦 실행 중: ${file}`);

        try {
            if (isTypeScript) {
                execSync(`npx tsx ${filePath}`, {
                    stdio: 'inherit',
                    cwd: path.join(__dirname, '..')
                });
            } else {
                execSync(`node ${filePath}`, {
                    stdio: 'inherit',
                    cwd: path.join(__dirname, '..')
                });
            }
            results.push({ file, status: '✅ 성공' });
        } catch (error) {
            results.push({ file, status: '❌ 실패', error: error.message });
            console.error(`❌ ${file} 실행 실패:`, error.message);
        }

        console.log('');
    }

    // 결과 요약
    console.log('═'.repeat(50));
    console.log('📊 실행 결과 요약');
    console.log('═'.repeat(50));

    for (const result of results) {
        console.log(`  ${result.status} ${result.file}`);
    }

    const successCount = results.filter(r => r.status.includes('성공')).length;
    const failCount = results.filter(r => r.status.includes('실패')).length;

    console.log('');
    console.log(`✨ 완료: ${successCount}개 성공, ${failCount}개 실패`);
}

runAllSeeds().catch(console.error);
