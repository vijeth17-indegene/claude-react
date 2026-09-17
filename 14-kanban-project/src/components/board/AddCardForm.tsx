import { useState, type KeyboardEvent, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type Props = { onAdd: (title: string) => void };

export default function AddCardForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle('');
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setTitle('');
      setOpen(false);
    }
  }

  function handleBlur() {
    submit();
    setOpen(false);
  }

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)}>
        + Add card
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="add-card">
      <Input
        autoFocus
        value={title}
        placeholder="Card title…"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
    </form>
  );
}