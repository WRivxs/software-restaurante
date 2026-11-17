import { Button } from '../ui/Button';

const BILLETES = [2000, 5000, 10000, 20000, 50000, 100000];

export default function BilletesRapidos({ onSelect }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {BILLETES.map((b) => (
        <Button
          key={b}
          variant="ghost"
          className="bg-bg-elevated border-bg-border hover:bg-brand-yellow hover:text-black py-4 font-black transition-all"
          onClick={() => onSelect(b)}
        >
          ${b.toLocaleString()}
        </Button>
      ))}
    </div>
  );
}
