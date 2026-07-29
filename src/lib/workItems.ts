export interface WorkItem {
  id: string;
  itemNo: string;
  description: string;
  unit: string;
  unitPrice: number;
  programmedQty: number;
  previous: number;
  thisPeriod: number;
  remarks: string;
}

export interface WorkItemComputed extends WorkItem {
  contractAmount: number;
  weightPct: number;
  toDate: number;
  accomplishmentWeightPct: number;
  status: string;
}

export interface SwaTotals {
  totalContractAmount: number;
  totalWeightPct: number;
  totalToDateWeightPct: number;
  pctThisAccomplishment: number;
  totalThisAccomplishment: number;
  totalVoucher: number;
}

export function computeWorkItems(
  items: WorkItem[],
  advancePayment = 0,
): { items: WorkItemComputed[]; totals: SwaTotals } {
  const totalContract = items.reduce(
    (sum, i) => sum + i.unitPrice * i.programmedQty,
    0,
  );

  const computed: WorkItemComputed[] = items.map((item) => {
    const contractAmount = item.unitPrice * item.programmedQty;
    const weightPct = totalContract > 0 ? (contractAmount / totalContract) * 100 : 0;
    const toDate = item.previous + item.thisPeriod;
    const accomplishmentWeightPct =
      item.programmedQty > 0 ? (toDate / item.programmedQty) * weightPct : 0;
    const pctComplete = item.programmedQty > 0 ? (toDate / item.programmedQty) * 100 : 0;
    const status = pctComplete >= 100 ? 'COMPLETED' : pctComplete > 0 ? 'ON GOING' : '';

    return {
      ...item,
      contractAmount,
      weightPct,
      toDate,
      accomplishmentWeightPct,
      status: item.remarks || status,
    };
  });

  const totalToDateWeightPct = computed.reduce((s, i) => s + i.accomplishmentWeightPct, 0);
  const totalThisAccomplishment = computed.reduce(
    (s, i) => s + i.thisPeriod * i.unitPrice,
    0,
  );
  const pctThisAccomplishment =
    totalContract > 0 ? (totalThisAccomplishment / totalContract) * 100 : 0;

  return {
    items: computed,
    totals: {
      totalContractAmount: totalContract,
      totalWeightPct: computed.reduce((s, i) => s + i.weightPct, 0),
      totalToDateWeightPct,
      pctThisAccomplishment,
      totalThisAccomplishment,
      totalVoucher: totalThisAccomplishment - advancePayment,
    },
  };
}

export function computeStewaSlippage(actual: number, planned: number): number {
  return Math.round((planned - actual) * 100) / 100;
}

export function formatMoney(n: number): string {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPct(n: number): string {
  return n.toFixed(2);
}

export function newWorkItem(): WorkItem {
  return {
    id: crypto.randomUUID(),
    itemNo: '',
    description: '',
    unit: '',
    unitPrice: 0,
    programmedQty: 0,
    previous: 0,
    thisPeriod: 0,
    remarks: '',
  };
}
