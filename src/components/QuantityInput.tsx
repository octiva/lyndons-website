import { useEffect, useId, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

export interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  onValidityChange?: (valid: boolean) => void;
  id?: string;
  stepperLabels?: { decrease: string; increase: string };
}

const errorMessage = 'Enter a whole number from 1 to 9999.';

function parseQuantity(text: string): number | null {
  if (!/^[0-9]+$/.test(text)) return null;
  const quantity = Number(text);
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= 9999 ? quantity : null;
}

export function QuantityInput({ value, onChange, label, onValidityChange, id, stepperLabels }: QuantityInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const [draft, setDraft] = useState({ value, text: String(value), blurred: false });

  // Only an external value change replaces a draft. Parent echoes of valid edits
  // must not erase formatting, and invalid edits must never restore an old value.
  if (draft.value !== value) {
    setDraft({ value, text: String(value), blurred: false });
  }

  const parsed = parseQuantity(draft.text);
  const valid = parsed !== null;
  const showError = draft.blurred && !valid;

  // Publish initial validity and externally changed values as well as user edits.
  useEffect(() => {
    onValidityChange?.(valid);
  }, [valid, onValidityChange]);

  function edit(text: string) {
    const next = parseQuantity(text);
    setDraft(previous => ({ value: next ?? value, text, blurred: previous.blurred }));
    onValidityChange?.(next !== null);
    if (next !== null) onChange(next);
  }

  const input = (
    <input
      id={inputId}
      type="text"
      inputMode="numeric"
      required
      pattern="0*[1-9][0-9]{0,3}"
      title={errorMessage}
      aria-label={label}
      aria-invalid={showError || undefined}
      aria-describedby={showError ? errorId : undefined}
      value={draft.text}
      onChange={event => edit(event.target.value)}
      onBlur={() => setDraft(previous => ({ ...previous, blurred: true }))}
    />
  );

  return (
    <div className="quantity-input">
      {stepperLabels ? (
        <div className="quantity">
          <button
            type="button"
            aria-label={stepperLabels.decrease}
            disabled={parsed === null || parsed <= 1}
            onClick={() => { if (parsed !== null) edit(String(parsed - 1)); }}
          >
            <Minus size={16} />
          </button>
          {input}
          <button
            type="button"
            aria-label={stepperLabels.increase}
            disabled={parsed === null || parsed >= 9999}
            onClick={() => { if (parsed !== null) edit(String(parsed + 1)); }}
          >
            <Plus size={16} />
          </button>
        </div>
      ) : input}
      {showError && (
        <p id={errorId} className="error" role="alert" style={{ maxWidth: '20ch', margin: '8px 0 0' }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}