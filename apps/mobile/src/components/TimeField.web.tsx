import React from 'react';
import { colors, radius, spacing } from '@/theme';

interface Props {
  value: Date;
  onChange: (date: Date) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Versão web do seletor de horário.
 * O componente nativo não existe no navegador, então usamos o campo de hora
 * do próprio HTML, que abre o seletor do sistema no celular.
 */
export function TimeField({ value, onChange }: Props) {
  const text = `${pad(value.getHours())}:${pad(value.getMinutes())}`;

  const handle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const [h, m] = event.target.value.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return;
    const next = new Date(value);
    next.setHours(h, m, 0, 0);
    onChange(next);
  };

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.bg,
        borderRadius: radius.md,
        padding: `${spacing.md}px`,
        cursor: 'pointer',
      }}
    >
      <input
        type="time"
        value={text}
        onChange={handle}
        style={{
          fontSize: 36,
          fontWeight: 800,
          color: colors.text,
          letterSpacing: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontFamily: 'inherit',
          width: '100%',
        }}
      />
    </label>
  );
}
