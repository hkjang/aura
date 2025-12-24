/**
 * 임베딩 모델 시드 데이터
 * Ollama bge-m3 모델을 기본 임베딩 모델로 설정
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');

const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL || 'file:./dev.db',
});

const prisma = new PrismaClient({
    adapter,
});

async function main() {
    console.log('Seeding embedding model configurations...');

    const embeddingModels = [
        {
            name: 'Ollama BGE-M3 (기본)',
            provider: 'ollama',
            modelId: 'bge-m3',
            dimension: 1024, // bge-m3의 기본 차원
            baseUrl: 'http://localhost:11434',
            apiKey: null,
            isActive: true,
            isDefault: true,
        },
        {
            name: 'Ollama Nomic Embed',
            provider: 'ollama',
            modelId: 'nomic-embed-text',
            dimension: 768,
            baseUrl: 'http://localhost:11434',
            apiKey: null,
            isActive: false,
            isDefault: false,
        },
        {
            name: 'OpenAI Ada 002',
            provider: 'openai',
            modelId: 'text-embedding-ada-002',
            dimension: 1536,
            baseUrl: null,
            apiKey: null, // 사용 시 API 키 필요
            isActive: false,
            isDefault: false,
        },
        {
            name: 'OpenAI 3 Small',
            provider: 'openai',
            modelId: 'text-embedding-3-small',
            dimension: 1536,
            baseUrl: null,
            apiKey: null,
            isActive: false,
            isDefault: false,
        },
        {
            name: 'OpenAI 3 Large',
            provider: 'openai',
            modelId: 'text-embedding-3-large',
            dimension: 3072,
            baseUrl: null,
            apiKey: null,
            isActive: false,
            isDefault: false,
        },
    ];

    // 기존 기본 모델 해제
    await prisma.embeddingModelConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
    });

    for (const model of embeddingModels) {
        const existing = await prisma.embeddingModelConfig.findFirst({
            where: { provider: model.provider, modelId: model.modelId },
        });

        if (existing) {
            await prisma.embeddingModelConfig.update({
                where: { id: existing.id },
                data: model,
            });
            console.log(`  Updated: ${model.name}`);
        } else {
            await prisma.embeddingModelConfig.create({
                data: model,
            });
            console.log(`  Created: ${model.name}`);
        }
    }

    console.log('Seeding embedding models completed.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
