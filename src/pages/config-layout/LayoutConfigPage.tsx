import { useEffect, useState } from 'react';
import { useLayoutConfigQuery, useSaveLayoutMutation } from '@/features/layout-config/api';
import type { LayoutNode } from '@/shared/types/contracts';
import { getErrorMessage } from '@/shared/types/errors';

const canvasWidth = 960;
const canvasHeight = 560;
const grid = 10;

function snap(value: number): number {
  return Math.round(value / grid) * grid;
}

function validateLayout(nodes: LayoutNode[]): string | null {
  const idSet = new Set<string>();
  for (const item of nodes) {
    if (idSet.has(item.collectorId)) {
      return 'LAYOUT_VALIDATION_FAILED';
    }
    idSet.add(item.collectorId);
    if (item.x < 0 || item.y < 0 || item.x > canvasWidth || item.y > canvasHeight) {
      return 'LAYOUT_VALIDATION_FAILED';
    }
  }
  return null;
}

export function LayoutConfigPage() {
  const query = useLayoutConfigQuery();
  const mutation = useSaveLayoutMutation();
  const [nodes, setNodes] = useState<LayoutNode[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    if (query.data && nodes.length === 0) {
      setNodes(query.data.nodes);
    }
  }, [query.data, nodes.length]);

  const onDrop = (collectorId: string, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((item) =>
        item.collectorId === collectorId
          ? { ...item, x: Math.max(0, Math.min(canvasWidth, snap(x))), y: Math.max(0, Math.min(canvasHeight, snap(y))) }
          : item
      )
    );
  };

  const onSave = async () => {
    const code = validateLayout(nodes);
    if (code) {
      setErrorCode(code);
      return;
    }
    setErrorCode(null);
    await mutation.mutateAsync({ version: query.data?.version ?? 1, nodes });
  };

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <h2 className="page-title">采集器布局配置</h2>
      <section className="panel">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>支持网格吸附（10px），拖拽后保存。</div>
          <button onClick={() => void onSave()} disabled={mutation.isPending || !query.data}>
            {mutation.isPending ? '保存中...' : '保存布局'}
          </button>
        </div>
        {errorCode ? <p className="error-text">{getErrorMessage(errorCode)}</p> : null}
        {mutation.isError ? <p className="error-text">{getErrorMessage((mutation.error as { code?: string }).code)}</p> : null}
      </section>
      <section
        className="panel"
        style={{ width: canvasWidth, height: canvasHeight, position: 'relative' }}
        onMouseMove={(event) => {
          if (!dragging) {
            return;
          }
          const rect = event.currentTarget.getBoundingClientRect();
          onDrop(dragging, event.clientX - rect.left, event.clientY - rect.top);
        }}
        onMouseUp={() => setDragging(null)}
      >
        {nodes.map((node) => (
          <button
            key={node.collectorId}
            style={{
              position: 'absolute',
              left: node.x,
              top: node.y,
              zIndex: node.zIndex,
              transform: 'translate(-50%, -50%)',
              padding: '4px 8px'
            }}
            onMouseDown={() => setDragging(node.collectorId)}
          >
            {node.collectorId}
          </button>
        ))}
      </section>
    </section>
  );
}
