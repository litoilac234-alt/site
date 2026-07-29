export interface IarAccomplishmentItem {
  id: string;
  itemNo: string;
  description: string;
  location: string;
  physicalQty: number | '';
  billableQty: number | '';
  unit: string;
}

export interface IarManpowerRow {
  id: string;
  description: string;
  quantity: number | '';
}

export interface IarVariationItem {
  id: string;
  itemNo: string;
  description: string;
  quantity: number | '';
  unit: string;
  additive: string;
  deductive: string;
  newItem: string;
}

export function newIarItem(): IarAccomplishmentItem {
  return {
    id: `iar-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    itemNo: '',
    description: '',
    location: '',
    physicalQty: '',
    billableQty: '',
    unit: '',
  };
}

export function newManpowerRow(): IarManpowerRow {
  return {
    id: `mp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: '',
    quantity: '',
  };
}

export function newVariationItem(): IarVariationItem {
  return {
    id: `vo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    itemNo: '',
    description: '',
    quantity: '',
    unit: '',
    additive: '',
    deductive: '',
    newItem: '',
  };
}
