export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug
  return <div>Page {slug}</div>;
}
