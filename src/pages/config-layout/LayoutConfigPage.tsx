import { useEffect, useMemo, useState } from 'react';
import { useLayoutConfigQuery, useSaveLayoutMutation } from '@/features/layout-config/api';
import type { CollectorRealtime, LayoutNode } from '@/shared/types/contracts';
import { getErrorMessage } from '@/shared/types/errors';
import { Scene2D5Canvas } from '@/pages/dashboard/components/Scene2D5Canvas';

const canvasWidth = 960;
const canvasHeight = 560;
const grid = 10;

function createDefaultNodes(count = 50): LayoutNode[] {
  return Array.from({ length: count }, (_, i) => ({
    collectorId: `C${String(i + 1).padStart(3, '0')}`,
    x: 90 + (i % 10) * 85,
    y: 80 + Math.floor(i / 10) * 95,
    zIndex: i,
    zone: `zone-${Math.floor(i / 10) + 1}`
  }));
}

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
  const [selected, setSelected] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    if (nodes.length > 0) {
      return;
    }

    if (query.data?.nodes && query.data.nodes.length > 0) {
      setNodes(query.data.nodes);
      setSelected(query.data.nodes[0].collectorId);
      return;
    }

    if (query.isError) {
      const defaults = createDefaultNodes(50);
      setNodes(defaults);
      setSelected(defaults[0].collectorId);
      setErrorCode('LAYOUT_NOT_FOUND');
    }
  }, [nodes.length, query.data, query.isError]);

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

  const collectorView: CollectorRealtime[] = nodes.map((item) => ({
    collectorId: item.collectorId,
    collectorName: item.collectorId,
    temp: 0,
    vib: 0,
    status: 'normal',
    zone: item.zone,
    updatedAt: new Date().toISOString()
  }));

  const selectedNode = nodes.find((item) => item.collectorId === selected) ?? null;

  const filteredNodes = useMemo(() => {
    const lower = keyword.trim().toLowerCase();
    if (!lower) {
      return nodes;
    }
    return nodes.filter((node) => node.collectorId.toLowerCase().includes(lower) || node.zone.toLowerCase().includes(lower));
  }, [keyword, nodes]);

  const applySelectedPatch = (patch: Partial<LayoutNode>) => {
    if (!selectedNode) {
      return;
    }
    setNodes((prev) =>
      prev.map((item) =>
        item.collectorId === selectedNode.collectorId
          ? {
              ...item,
              ...patch,
              x: patch.x === undefined ? item.x : Math.max(0, Math.min(canvasWidth, snap(patch.x))),
              y: patch.y === undefined ? item.y : Math.max(0, Math.min(canvasHeight, snap(patch.y)))
            }
          : item
      )
    );
  };

  const placeSelectedAt = (x: number, y: number) => {
    if (!selectedNode) {
      return;
    }
    onDrop(selectedNode.collectorId, x, y);
  };

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <h2 className="page-title">采集器布局配置</h2>
      <section className="panel">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>右侧选择采集器，左侧 2.5D 中拖拽或点击定位。</div>
          <div className="row">
            <button
              onClick={() => {
                const defaults = createDefaultNodes(50);
                setNodes(defaults);
                setSelected(defaults[0].collectorId);
                setErrorCode(null);
              }}
            >
              生成默认采集器
            </button>
            <button onClick={() => void onSave()} disabled={mutation.isPending || !query.data}>
              {mutation.isPending ? '保存中...' : '保存布局'}
            </button>
          </div>
        </div>
        {errorCode ? <p className="error-text">{getErrorMessage(errorCode)}</p> : null}
        {mutation.isError ? <p className="error-text">{getErrorMessage((mutation.error as { code?: string }).code)}</p> : null}
      </section>
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12 }}>
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
          onMouseLeave={() => setDragging(null)}
          onClick={(event) => {
            if (event.target !== event.currentTarget || !selectedNode) {
              return;
            }
            const rect = event.currentTarget.getBoundingClientRect();
            placeSelectedAt(event.clientX - rect.left, event.clientY - rect.top);
          }}
        >
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <Scene2D5Canvas layout={nodes} collectors={collectorView} title="2.5D 布局编辑底图" embedded />
          </div>
          {nodes.map((node) => (
            <button
              key={node.collectorId}
              style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
                zIndex: node.zIndex,
                transform: 'translate(-50%, -50%)',
                padding: '4px 8px',
                borderColor: selected === node.collectorId ? '#3dc6ff' : '#2f4f73',
                boxShadow: selected === node.collectorId ? '0 0 0 2px rgba(61,198,255,.35)' : 'none'
              }}
              onMouseDown={() => {
                setDragging(node.collectorId);
                setSelected(node.collectorId);
              }}
            >
              {node.collectorId}
            </button>
          ))}
          {selectedNode ? (
            <div
              style={{
                position: 'absolute',
                left: selectedNode.x,
                top: selectedNode.y,
                width: 40,
                height: 40,
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                border: '2px solid #3dc6ff',
                boxShadow: '0 0 0 8px rgba(61,198,255,0.18)',
                pointerEvents: 'none'
              }}
            />
          ) : null}
        </section>
        <section className="panel">
          <h3 style={{ marginTop: 0 }}>采集器匹配</h3>
          <input placeholder="搜索 collectorId / zone" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <div style={{ marginTop: 8, maxHeight: 220, overflow: 'auto', display: 'grid', gap: 6 }}>
            {filteredNodes.length === 0 ? <div style={{ color: '#9cb9d5' }}>当前无采集器，请点击“生成默认采集器”。</div> : null}
            {filteredNodes.map((node) => (
              <button
                key={node.collectorId}
                style={{
                  textAlign: 'left',
                  borderColor: selected === node.collectorId ? '#3dc6ff' : '#2f4f73',
                  background: selected === node.collectorId ? 'rgba(61,198,255,0.15)' : undefined
                }}
                onClick={() => setSelected(node.collectorId)}
              >
                <div>{node.collectorId}</div>
                <div style={{ fontSize: 12, color: '#9cb9d5' }}>
                  ({node.x}, {node.y}) / {node.zone}
                </div>
              </button>
            ))}
          </div>
          <h4 style={{ marginBottom: 8 }}>当前选中</h4>
          {selectedNode ? (
            <div style={{ display: 'grid', gap: 8 }}>
              <label>
                collectorId
                <input value={selectedNode.collectorId} disabled />
              </label>
              <label>
                x
                <input
                  type="number"
                  value={selectedNode.x}
                  step={grid}
                  onChange={(e) => applySelectedPatch({ x: Number(e.target.value) })}
                />
              </label>
              <label>
                y
                <input
                  type="number"
                  value={selectedNode.y}
                  step={grid}
                  onChange={(e) => applySelectedPatch({ y: Number(e.target.value) })}
                />
              </label>
              <label>
                zIndex
                <input type="number" value={selectedNode.zIndex} onChange={(e) => applySelectedPatch({ zIndex: Number(e.target.value) })} />
              </label>
              <label>
                zone
                <input value={selectedNode.zone} onChange={(e) => applySelectedPatch({ zone: e.target.value || 'zone-a' })} />
              </label>
              <button onClick={() => placeSelectedAt(canvasWidth / 2, canvasHeight / 2)}>定位到画布中心</button>
            </div>
          ) : (
            <p>点击左侧点位后可编辑坐标与区域。</p>
          )}
        </section>
      </section>
    </section>
  );
}
