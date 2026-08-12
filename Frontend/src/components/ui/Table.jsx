/**
 * Thin wrappers over the native table elements so every table in the app
 * shares the same borders, padding and header treatment.
 * The outer div scrolls horizontally so tables never break the page layout
 * on mobile (PROJECT_PLAN.md §9).
 */
export const Table = ({ children, className = '' }) => (
  <div className={`w-full overflow-x-auto ${className}`}>
    <table className="w-full min-w-[640px] border-collapse text-sm">
      {children}
    </table>
  </div>
);

export const THead = ({ children }) => (
  <thead className="border-b border-slate-200 bg-slate-50">{children}</thead>
);

export const TBody = ({ children }) => (
  <tbody className="divide-y divide-slate-100">{children}</tbody>
);

export const TR = ({ children, onClick, className = '' }) => (
  <tr
    onClick={onClick}
    className={[
      onClick ? 'cursor-pointer' : '',
      'transition-colors hover:bg-slate-50/70',
      className,
    ].join(' ')}
  >
    {children}
  </tr>
);

export const TH = ({ children, className = '' }) => (
  <th
    scope="col"
    className={`px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase ${className}`}
  >
    {children}
  </th>
);

export const TD = ({ children, className = '' }) => (
  <td className={`px-4 py-3 align-middle text-slate-700 ${className}`}>
    {children}
  </td>
);

export default Table;
