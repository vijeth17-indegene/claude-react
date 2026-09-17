import type { BoardColumn } from '@/types/board';

export const seedColumns: BoardColumn[] = [
  {
    id: 'todo',
    title: 'To Do',
    cards: [
      { id: 'c1', title: 'Set up CI pipeline', labels: [{ id: 'l1', name: 'bug', color: '#e11d48' }] },
      { id: 'c2', title: 'Write onboarding docs', labels: [] },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    cards: [
      {
        id: 'c3',
        title: 'Fix login redirect',
        labels: [
          { id: 'l1', name: 'bug',    color: '#e11d48' },
          { id: 'l2', name: 'urgent', color: '#b45309' },
        ],
      },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    cards: [
      { id: 'c4', title: 'Update dependencies', labels: [] },
      { id: 'c5', title: 'Add error boundary', labels: [{ id: 'l3', name: 'chore', color: '#64748b' }] },
    ],
  },
];