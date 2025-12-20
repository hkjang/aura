import { Card } from "@/components/ui/card";
import { GraphView } from "@/components/knowledge/graph-view";
import { KnowledgeService } from "@/lib/knowledge/knowledge-service";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function KnowledgeDashboardPage() {
  const graphData = await KnowledgeService.getGraphData();
  const documents = await prisma.document.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
  });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>지식 그래프 & 검색</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
          문서 간의 관계를 탐색하고 지식 베이스를 관리하세요.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
         <div style={{ gridColumn: 'span 2' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>지식 네트워크</h2>
            <GraphView data={graphData} />
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>통계</h2>
            <div style={{ display: 'grid', gap: '16px' }}>
                <Card className="p-4">
                     <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>총 문서</p>
                     <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{graphData.nodes.length}</h3>
                </Card>
                <Card className="p-4">
                     <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>인덱싱된 관계</p>
                     <h3 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>{graphData.links.length}</h3>
                </Card>
            </div>
         </div>
      </div>

      <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>최근 문서</h2>
          <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        <th>제목</th>
                        <th>생성일</th>
                        <th>상태</th>
                    </tr>
                </thead>
                <tbody>
                    {documents.map(doc => (
                        <tr key={doc.id}>
                            <td style={{ fontWeight: 500 }}>{doc.title}</td>
                            <td>{new Date(doc.createdAt).toLocaleDateString('ko-KR')}</td>
                            <td>
                                <span className="status status-success">인덱싱됨</span>
                            </td>
                        </tr>
                    ))}
                    {documents.length === 0 && (
                        <tr>
                            <td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                              문서가 없습니다.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );
}
