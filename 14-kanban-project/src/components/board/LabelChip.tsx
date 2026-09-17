type Props = { name: string; color: string };

export default function LabelChip({ name, color }: Props) {
  return (
    <span className="chip" style={{ backgroundColor: color }}>
      {name}
    </span>
  );
}