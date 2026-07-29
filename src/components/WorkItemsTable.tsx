import {
  computeWorkItems,
  formatMoney,
  formatPct,
  newWorkItem,
  type WorkItem,
} from '../lib/workItems';

interface WorkItemsTableProps {
  items: WorkItem[];
  advancePayment: number;
  onChange: (items: WorkItem[]) => void;
  readOnly?: boolean;
}

export function WorkItemsTable({ items, advancePayment, onChange, readOnly }: WorkItemsTableProps) {
  const { items: computed, totals } = computeWorkItems(items, advancePayment);

  const update = (id: string, patch: Partial<WorkItem>) => {
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const addRow = () => onChange([...items, newWorkItem()]);
  const removeRow = (id: string) => onChange(items.filter((i) => i.id !== id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-xs">
        <thead>
          <tr className="border-b border-border bg-surface-muted">
            <th className="p-2">Item No.</th>
            <th className="p-2 text-left">Description</th>
            <th className="p-2">Unit</th>
            <th className="p-2">Unit Price</th>
            <th className="p-2">Prog. Qty</th>
            <th className="p-2">Contract Amt</th>
            <th className="p-2">Weight %</th>
            <th className="p-2">Previous</th>
            <th className="p-2">This Period</th>
            <th className="p-2">To Date</th>
            <th className="p-2">Wt % Accomp.</th>
            <th className="p-2">Remarks</th>
            {!readOnly && <th className="p-2" />}
          </tr>
        </thead>
        <tbody>
          {computed.map((row) => (
            <tr key={row.id} className="border-b border-border/50">
              {(['itemNo', 'description', 'unit'] as const).map((field) => (
                <td key={field} className="p-1">
                  {readOnly ? (
                    row[field]
                  ) : (
                    <input
                      className="w-full rounded border border-border px-1 py-0.5"
                      value={row[field]}
                      onChange={(e) => update(row.id, { [field]: e.target.value })}
                    />
                  )}
                </td>
              ))}
              {(['unitPrice', 'programmedQty', 'previous', 'thisPeriod'] as const).map((field) => (
                <td key={field} className="p-1">
                  {readOnly ? (
                    field === 'unitPrice' ? formatMoney(row[field]) : row[field]
                  ) : (
                    <input
                      type="number"
                      step="0.01"
                      className="w-20 rounded border border-border px-1 py-0.5 text-right"
                      value={row[field] || ''}
                      onChange={(e) => update(row.id, { [field]: parseFloat(e.target.value) || 0 })}
                    />
                  )}
                </td>
              ))}
              <td className="p-1 text-right">{formatMoney(row.contractAmount)}</td>
              <td className="p-1 text-right">{formatPct(row.weightPct)}</td>
              <td className="p-1 text-right">{row.toDate}</td>
              <td className="p-1 text-right">{formatPct(row.accomplishmentWeightPct)}</td>
              <td className="p-1">
                {readOnly ? (
                  row.remarks || row.status
                ) : (
                  <input
                    className="w-full rounded border border-border px-1 py-0.5"
                    value={row.remarks}
                    placeholder={row.status}
                    onChange={(e) => update(row.id, { remarks: e.target.value })}
                  />
                )}
              </td>
              {!readOnly && (
                <td className="p-1">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-red-500 hover:underline"
                  >
                    ×
                  </button>
                </td>
              )}
            </tr>
          ))}
          <tr className="bg-surface-muted font-semibold">
            <td colSpan={5} className="p-2 text-right">
              TOTAL
            </td>
            <td className="p-2 text-right">{formatMoney(totals.totalContractAmount)}</td>
            <td className="p-2 text-right">{formatPct(totals.totalWeightPct)}</td>
            <td colSpan={2} />
            <td className="p-2 text-right">{formatPct(totals.totalToDateWeightPct)}</td>
            <td colSpan={readOnly ? 1 : 2} />
          </tr>
        </tbody>
      </table>
      {!readOnly && (
        <button
          type="button"
          onClick={addRow}
          className="mt-3 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-muted"
        >
          + Add work item
        </button>
      )}
      <div className="mt-4 grid gap-1 text-sm sm:ml-auto sm:w-72">
        <div className="flex justify-between">
          <span>% This Accomplishment</span>
          <strong>{formatPct(totals.pctThisAccomplishment)}%</strong>
        </div>
        <div className="flex justify-between">
          <span>Total This Accomplishment</span>
          <strong>P {formatMoney(totals.totalThisAccomplishment)}</strong>
        </div>
        <div className="flex justify-between">
          <span>Total Voucher</span>
          <strong>P {formatMoney(totals.totalVoucher)}</strong>
        </div>
      </div>
    </div>
  );
}
