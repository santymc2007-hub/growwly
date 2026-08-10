type Props = { className?: string };

const stroke = "currentColor";

export function IconoFrontal({ className }: Props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <ellipse cx="24" cy="22" rx="13" ry="15" stroke={stroke} strokeWidth="2" />
      <path
        d="M12 18c1-6 6-10 12-10s11 4 12 10"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="18.5" cy="22" r="1.4" fill={stroke} />
      <circle cx="29.5" cy="22" r="1.4" fill={stroke} />
      <path
        d="M21 29c1 1.2 5 1.2 6 0"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconoTrasera({ className }: Props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <ellipse cx="24" cy="22" rx="13" ry="15" stroke={stroke} strokeWidth="2" />
      <path
        d="M13 16c3-1 5-2 11-2s8 1 11 2"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 22c3-1 6-1.5 10-1.5s7 .5 10 1.5"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M15 28c3-1 5.5-1.5 9-1.5s6 .5 9 1.5"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M22 41c-3-4-4-8-2-12"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconoCoronilla({ className }: Props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="24" r="15" stroke={stroke} strokeWidth="2" />
      <path
        d="M24 24c0-5 3-8 7-8M24 24c-2-4-1-9 2-11M24 24c-4-2-9-1-11 2M24 24c-2 4-1 9 2 11M24 24c4 2 9 1 11-2"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="24" cy="24" r="2" fill={stroke} />
    </svg>
  );
}

export function IconoPerfilDerecho({ className }: Props) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <path
        d="M15 30c-1-2-1-4 0-6-1-1-1-3 0-4 1-6 6-10 12-10 5 0 8 3 9 7 2 1 3 3 2 6-1 1-1 3 0 4-3 1-4 3-4 6v4c0 2-2 3-4 3h-2v-4c-6 0-11-3-13-6z"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="30" cy="21" r="1.4" fill={stroke} />
      <path
        d="M27 27c1 1 3 1 4 0"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconoPerfilIzquierdo({ className }: Props) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      style={{ transform: "scaleX(-1)" }}
    >
      <path
        d="M15 30c-1-2-1-4 0-6-1-1-1-3 0-4 1-6 6-10 12-10 5 0 8 3 9 7 2 1 3 3 2 6-1 1-1 3 0 4-3 1-4 3-4 6v4c0 2-2 3-4 3h-2v-4c-6 0-11-3-13-6z"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="30" cy="21" r="1.4" fill={stroke} />
      <path
        d="M27 27c1 1 3 1 4 0"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
