import { atomWithHash } from 'jotai-location'

export interface TaskModalType {
    type: "new" | "edit" | "view" | null;
    taskId: string | null;
    workstationId: string | null;
}

export const taskModal = atomWithHash<TaskModalType>('taskModal', {
    type: null,
    taskId: null,
    workstationId: null,
});