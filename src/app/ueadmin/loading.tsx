export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="adm-skeleton h-7 w-56" />
          <div className="adm-skeleton h-4 w-80 max-w-full" />
        </div>
        <div className="adm-skeleton hidden h-9 w-32 sm:block" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="adm-skeleton h-3.5 w-24" />
            <div className="adm-skeleton mt-3 h-7 w-32" />
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4">
          <div className="adm-skeleton h-9 w-72 max-w-full" />
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="adm-skeleton h-4 w-20" />
              <div className="adm-skeleton h-4 flex-1" />
              <div className="adm-skeleton hidden h-4 w-24 sm:block" />
              <div className="adm-skeleton h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
