'use client';

import { useState, useEffect } from 'react';
import { MapPin, Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { COUNTRY_CONFIG, getCountryRegions, getActiveCountries } from '@/lib/address-config';

interface AddressFormData {
  fullName: string;
  phone: string;
  email: string;
  country: string;
  region: string;
  city: string;
  address1: string;
  address2: string;
  postalCode: string;
}

interface AddressFormProps {
  onSubmit?: (data: AddressFormData) => Promise<void>;
  initialData?: Partial<AddressFormData>;
  isLoading?: boolean;
}

export function ImprovedAddressForm({
  onSubmit,
  initialData,
  isLoading = false,
}: AddressFormProps) {
  const [formData, setFormData] = useState<AddressFormData>({
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    country: initialData?.country || 'AE',
    region: initialData?.region || '',
    city: initialData?.city || '',
    address1: initialData?.address1 || '',
    address2: initialData?.address2 || '',
    postalCode: initialData?.postalCode || '',
  });

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<AddressFormData>>({});
  const [submitting, setSubmitting] = useState(false);

  const activeCountries = getActiveCountries();
  const countryRegions = getCountryRegions(formData.country);

  // Detect user's country based on IP geolocation
  useEffect(() => {
    const detectCountry = async () => {
      setGeoLoading(true);
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const detectedCode = data.country_code;

        // Check if detected country is in our active countries
        if (activeCountries.some((c) => c.code === detectedCode)) {
          setDetectedCountry(detectedCode);
        }
      } catch (error) {
        console.log('Geolocation detection skipped:', error);
      } finally {
        setGeoLoading(false);
      }
    };

    // Only detect if no initial country set
    if (!initialData?.country) {
      detectCountry();
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<AddressFormData> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.country) newErrors.country = 'Country is required';
    if (!formData.address1.trim()) newErrors.address1 = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';

    if (countryRegions.length > 0 && !formData.region) {
      newErrors.region = 'Region is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
      toast.success('Address saved successfully!');
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUseDetectedCountry = () => {
    if (detectedCountry) {
      setFormData((prev) => ({
        ...prev,
        country: detectedCountry,
        region: '',
      }));
      setDetectedCountry(null);
      toast.success(`Country set to ${COUNTRY_CONFIG[detectedCountry].name}`);
    }
  };

  const handleCountryChange = (newCountry: string) => {
    setFormData((prev) => ({
      ...prev,
      country: newCountry,
      region: '', // Reset region when country changes
      city: '',
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name as keyof AddressFormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const currentCountry = COUNTRY_CONFIG[formData.country];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      {/* Detected Location Badge */}
      {detectedCountry && !initialData?.country && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-4">
          <MapPin className="text-blue-600 mt-1 flex-shrink-0" size={20} />
          <div className="flex-1">
            <p className="font-semibold text-blue-900 mb-2">
              📍 We detected your location: {COUNTRY_CONFIG[detectedCountry].name}
            </p>
            <button
              type="button"
              onClick={handleUseDetectedCountry}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              Use This Country
            </button>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-black text-gray-900 mb-1">Delivery Address</h2>
        <p className="text-sm text-gray-600">
          We deliver to {activeCountries.length} countries. Estimated delivery: {currentCountry?.estimatedDays} business days.
        </p>
      </div>

      {/* Country & Region Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Country <span className="text-red-500">*</span>
          </label>
          <select
            name="country"
            value={formData.country}
            onChange={(e) => handleCountryChange(e.target.value)}
            disabled={isLoading || submitting}
            className={`w-full px-4 py-3 border-2 rounded-lg font-medium transition focus:outline-none focus:border-blue-500 ${
              errors.country ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:bg-blue-50'
            }`}
          >
            <option value="">Select Country</option>
            {activeCountries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name} ({country.currency})
              </option>
            ))}
          </select>
          {errors.country && <p className="text-red-600 text-xs mt-1">{errors.country}</p>}
        </div>

        {countryRegions.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Region <span className="text-red-500">*</span>
            </label>
            <select
              name="region"
              value={formData.region}
              onChange={handleInputChange}
              disabled={isLoading || submitting}
              className={`w-full px-4 py-3 border-2 rounded-lg font-medium transition focus:outline-none focus:border-blue-500 ${
                errors.region ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:bg-blue-50'
              }`}
            >
              <option value="">Select Region/Area</option>
              {countryRegions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
            {errors.region && <p className="text-red-600 text-xs mt-1">{errors.region}</p>}
          </div>
        )}
      </div>

      {/* Personal Info Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            disabled={isLoading || submitting}
            placeholder="e.g., John Doe"
            className={`w-full px-4 py-3 border-2 rounded-lg font-medium transition focus:outline-none focus:border-blue-500 ${
              errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:bg-blue-50'
            }`}
          />
          {errors.fullName && <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            disabled={isLoading || submitting}
            
            className={`w-full px-4 py-3 border-2 rounded-lg font-medium transition focus:outline-none focus:border-blue-500 ${
              errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:bg-blue-50'
            }`}
          />
          {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
        </div>
      </div>

      {/* Email & City Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isLoading || submitting}
            placeholder="e.g., john@example.com"
            className={`w-full px-4 py-3 border-2 rounded-lg font-medium transition focus:outline-none focus:border-blue-500 ${
              errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:bg-blue-50'
            }`}
          />
          {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            disabled={isLoading || submitting}
            placeholder="e.g., Dubai"
            className={`w-full px-4 py-3 border-2 rounded-lg font-medium transition focus:outline-none focus:border-blue-500 ${
              errors.city ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:bg-blue-50'
            }`}
          />
          {errors.city && <p className="text-red-600 text-xs mt-1">{errors.city}</p>}
        </div>
      </div>

      {/* Address Line 1 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Street Address <span className="text-red-500">*</span>
        </label>
        <textarea
          name="address1"
          value={formData.address1}
          onChange={handleInputChange}
          disabled={isLoading || submitting}
          placeholder="e.g., 123 Sheikh Zayed Road, Building Name"
          rows={2}
          className={`w-full px-4 py-3 border-2 rounded-lg font-medium transition focus:outline-none focus:border-blue-500 resize-none ${
            errors.address1 ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:bg-blue-50'
          }`}
        />
        {errors.address1 && <p className="text-red-600 text-xs mt-1">{errors.address1}</p>}
      </div>

      {/* Address Line 2 */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Apartment, Suite, etc. <span className="text-gray-400 text-xs">(Optional)</span>
        </label>
        <input
          type="text"
          name="address2"
          value={formData.address2}
          onChange={handleInputChange}
          disabled={isLoading || submitting}
          placeholder="e.g., Apt 502, Floor 5"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-medium transition focus:outline-none focus:border-blue-500 focus:bg-blue-50"
        />
      </div>

      {/* Postal Code */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Postal Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="postalCode"
          value={formData.postalCode}
          onChange={handleInputChange}
          disabled={isLoading || submitting}
          placeholder="e.g., 12345"
          className={`w-full px-4 py-3 border-2 rounded-lg font-medium transition focus:outline-none focus:border-blue-500 ${
            errors.postalCode ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:bg-blue-50'
          }`}
        />
        {errors.postalCode && <p className="text-red-600 text-xs mt-1">{errors.postalCode}</p>}
      </div>

      {/* Delivery Info Box */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm">
            <p className="font-semibold text-emerald-900">
              📦 Delivery Details for {currentCountry?.name}
            </p>
            <ul className="text-emerald-800 mt-2 space-y-1 text-xs">
              <li>✓ Estimated delivery: {currentCountry?.estimatedDays} business days</li>
              <li>✓ Minimum order: {currentCountry && currentCountry.minOrder.toFixed(0)} {currentCountry?.currency}</li>
              <li>✓ Free delivery on orders above {currentCountry && currentCountry.freeDelivery.toFixed(0)} {currentCountry?.currency}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || submitting || geoLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader size={18} className="animate-spin" />
            Saving Address...
          </>
        ) : (
          <>
            <MapPin size={18} />
            Save Address & Continue
          </>
        )}
      </button>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center">
        💡 We only accept orders from the selected countries. Your delivery time and costs may vary by location.
      </p>
    </form>
  );
}
