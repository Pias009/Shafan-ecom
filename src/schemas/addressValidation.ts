import { z } from "zod";

export const addressValidationSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  phone: z.string().trim().min(5, "Phone number is required").max(20),
  email: z.string().email().optional().or(z.literal("")),
  country: z.string().trim().min(1, "Country is required"),
  city_name: z.string().trim().min(1, "City name is required"),
  area_name: z.string().trim().min(1, "Area name is required"),
  street_road: z.string().trim().min(1, "Street or Road name is required for accurate courier delivery"),
  house_building: z.string().trim().optional().or(z.literal("")),
  postalCode: z.string().trim().optional().or(z.literal("")),
});

export type AddressFormData = z.infer<typeof addressValidationSchema>;

export const addressFieldLabels: Record<string, string> = {
  fullName: "Full Name",
  phone: "Phone Number",
  email: "Email",
  country: "Country",
  city_name: "City",
  area_name: "Area / District Name",
  street_road: "Street / Road Name",
  house_building: "House / Building / Apartment",
  postalCode: "Postal Code",
};

export const addressFieldPlaceholders: Record<string, string> = {
  fullName: "Enter your full name",
  phone: "5XX XXX XXXX",
  country: "Select Country",
  city_name: "Enter your city",
  area_name: "Enter area or district",
  street_road: "Street name, road number",
  house_building: "Apartment 4B, Building 12 (Optional)",
  postalCode: "12345",
};

export const addressFieldRequired: Record<string, boolean> = {
  fullName: true,
  phone: true,
  country: true,
  city_name: true,
  area_name: true,
  street_road: true,
  house_building: false,
  postalCode: false,
  email: false,
};
