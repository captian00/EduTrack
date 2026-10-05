export function FeaturePlaceholder({ title, description }: Readonly<{ title: string; description: string }>) {
  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        Module đã được khởi tạo và sẽ được triển khai theo thứ tự trong specification.
      </div>
    </div>
  );
}
