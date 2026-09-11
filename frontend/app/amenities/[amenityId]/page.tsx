import { BookAmenityView } from "@/components/amenities/book-amenity-view";

export default async function BookAmenityPage({
  params,
}: {
  params: Promise<{ amenityId: string }>;
}) {
  const { amenityId } = await params;
  return <BookAmenityView amenityId={amenityId} />;
}
