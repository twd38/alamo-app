import { atom } from 'jotai';

export interface TaskModalState {
  type: 'new' | 'edit' | null;
  taskId: string | null;
  kanbanSectionId: string | null;
}

export const taskModal = atom<TaskModalState>({
  type: null,
  taskId: null,
  kanbanSectionId: null
});

export interface FilterType {
  id: string;
  type: string;
  operator: string;
  value: string;
}

export interface FilterState {
  filters: FilterType[];
}

export const filterStateAtom = atom<FilterState>({
  filters: []
});
