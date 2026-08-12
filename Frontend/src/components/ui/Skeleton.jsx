const Skeleton = ({ className = 'h-4 w-full' }) => (
  <div className={`animate-pulse rounded bg-slate-200 ${className}`} />
);

export const SkeletonText = ({ lines = 3 }) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        className={`h-3.5 ${index === lines - 1 ? 'w-2/3' : 'w-full'}`}
      />
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <Skeleton className="mb-4 h-4 w-1/3" />
    <SkeletonText lines={3} />
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 5 }) => (
  <div className="divide-y divide-slate-100">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex items-center gap-4 px-4 py-3.5">
        {Array.from({ length: columns }).map((_, columnIndex) => (
          <Skeleton
            key={columnIndex}
            className={`h-3.5 ${columnIndex === 0 ? 'w-1/4' : 'flex-1'}`}
          />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;
