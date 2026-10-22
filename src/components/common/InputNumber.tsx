import React from 'react';

export type InputNumberProps = {
  name: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
};

export const InputNumber: React.FC<InputNumberProps> = ({
  name,
  value,
  onChange,
  min,
  max,
  step
}) => {
  return (
    <label>
      {name}
      <input
        type="number"
        value={Number(value.toFixed(3))}
        min={min}
        max={max}
        step={step ?? 0.1}
        onChange={e => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
      />
    </label>
  );
};

export const colorField = (name: string, value: string, onChange: (v: string) => void) => (
  <label>
    {name}
    <input
      type="color"
      value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff'}
      onChange={e => onChange(e.target.value)}
    />
  </label>
);
