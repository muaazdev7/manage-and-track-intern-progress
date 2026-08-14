/**
 * Thin wrappers over the native table elements, carrying Nocturne's .table
 * treatment — uppercase micro-headers and row rules that fade out at both
 * ends rather than stopping cleanly.
 *
 * The outer div scrolls horizontally so tables never break the page layout
 * on mobile.
 */
export const Table = ({ children, className = '' }) => (
  <div className={`w-full overflow-x-auto ${className}`}>
    <table className="table min-w-[640px]">{children}</table>
  </div>
);

export const THead = ({ children }) => <thead>{children}</thead>;

export const TBody = ({ children }) => <tbody>{children}</tbody>;

export const TR = ({ children, onClick, className = '' }) => (
  <tr onClick={onClick} className={[onClick ? 'cursor-pointer' : '', className].join(' ')}>
    {children}
  </tr>
);

export const TH = ({ children, className = '' }) => (
  <th scope="col" className={className}>
    {children}
  </th>
);

export const TD = ({ children, className = '' }) => (
  <td className={`align-middle text-slate-700 ${className}`}>{children}</td>
);

export default Table;
