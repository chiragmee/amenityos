import { PassView } from "@/components/pass/pass-view";

export default async function PassPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  return <PassView bookingId={bookingId} />;
}
