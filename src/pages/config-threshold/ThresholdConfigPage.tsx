import { useEffect, useMemo, useState } from 'react';
import { useSaveThresholdMutation, useSyncThresholdMutation, useThresholdsQuery } from '@/features/threshold-config/api';
import { validateThreshold } from '@/entities/threshold/model';
import { getErrorMessage } from '@/shared/types/errors';
import type { ThresholdConfig } from '@/shared/types/contracts';

type FormState = Omit<ThresholdConfig, 'updatedAt'>;

export function ThresholdConfigPage() {
  const query = useThresholdsQuery();
  const saveMutation = useSaveThresholdMutation();
  const syncMutation = useSyncThresholdMutation();
  const [selected, setSelected] = useState<string>('');
  const [targets, setTargets] = useState<string[]>([]);

  const rows = query.data ?? [];
  const selectedRow = useMemo(() => rows.find((item) => item.collectorId === selected) ?? rows[0], [rows, selected]);
  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    if (selectedRow) {
      setForm({
        collectorId: selectedRow.collectorId,
        tempWarn: selectedRow.tempWarn,
        tempAlarm: selectedRow.tempAlarm,
        vibWarn: selectedRow.vibWarn,
        vibAlarm: selectedRow.vibAlarm
      });
      setSelected(selectedRow.collectorId);
    }
  }, [selectedRow]);

  const onSave = async () => {
    if (!form) {
      return;
    }
    const code = validateThreshold(form);
    if (code) {
      window.alert(getErrorMessage(code));
      return;
    }
    await saveMutation.mutateAsync({
      collectorId: form.collectorId,
      payload: {
        tempWarn: form.tempWarn,
        tempAlarm: form.tempAlarm,
        vibWarn: form.vibWarn,
        vibAlarm: form.vibAlarm
      }
    });
  };

  const onSync = async () => {
    if (!form) {
      return;
    }
    await syncMutation.mutateAsync({
      sourceCollectorId: form.collectorId,
      targetCollectorIds: targets
    });
  };

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <h2 className="page-title">阈值配置与批量同步</h2>
      <section className="panel">
        <div className="row">
          <label>采集器</label>
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            {rows.map((item) => (
              <option key={item.collectorId} value={item.collectorId}>
                {item.collectorId}
              </option>
            ))}
          </select>
        </div>
        {form ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(220px, 1fr))', gap: 10, marginTop: 12 }}>
            <label>
              tempWarn
              <input type="number" step="0.001" value={form.tempWarn} onChange={(e) => setForm({ ...form, tempWarn: Number(e.target.value) })} />
            </label>
            <label>
              tempAlarm
              <input type="number" step="0.001" value={form.tempAlarm} onChange={(e) => setForm({ ...form, tempAlarm: Number(e.target.value) })} />
            </label>
            <label>
              vibWarn
              <input type="number" step="0.001" value={form.vibWarn} onChange={(e) => setForm({ ...form, vibWarn: Number(e.target.value) })} />
            </label>
            <label>
              vibAlarm
              <input type="number" step="0.001" value={form.vibAlarm} onChange={(e) => setForm({ ...form, vibAlarm: Number(e.target.value) })} />
            </label>
          </div>
        ) : null}
        <div className="row" style={{ marginTop: 12 }}>
          <button onClick={() => void onSave()} disabled={saveMutation.isPending}>
            保存阈值
          </button>
          <select
            multiple
            style={{ minHeight: 120, minWidth: 240 }}
            value={targets}
            onChange={(e) => setTargets(Array.from(e.currentTarget.selectedOptions).map((opt) => opt.value))}
          >
            {rows
              .filter((item) => item.collectorId !== form?.collectorId)
              .map((item) => (
                <option key={item.collectorId} value={item.collectorId}>
                  {item.collectorId}
                </option>
              ))}
          </select>
          <button onClick={() => void onSync()} disabled={syncMutation.isPending}>
            批量同步
          </button>
        </div>
        {saveMutation.isError ? <p className="error-text">{getErrorMessage((saveMutation.error as { code?: string }).code)}</p> : null}
        {syncMutation.isError ? <p className="error-text">{getErrorMessage((syncMutation.error as { code?: string }).code)}</p> : null}
      </section>
      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>collectorId</th>
              <th>tempWarn</th>
              <th>tempAlarm</th>
              <th>vibWarn</th>
              <th>vibAlarm</th>
              <th>updatedAt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.collectorId}>
                <td>{row.collectorId}</td>
                <td>{row.tempWarn}</td>
                <td>{row.tempAlarm}</td>
                <td>{row.vibWarn}</td>
                <td>{row.vibAlarm}</td>
                <td>{row.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}
