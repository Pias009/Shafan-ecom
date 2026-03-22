import { Suspense } from "react";
import AddressForm from "../_components/AddressForm";

export default function AddressPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading address form...</div>}>
      <AddressForm />
    </Suspense>
  );
}
