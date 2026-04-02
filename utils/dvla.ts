const DVLA_API_URL = 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';

export interface DvlaVehicleResult {
  make: string;
  model?: string;
  yearOfManufacture?: number;
  engineCapacity?: number;
  fuelType?: string;
  colour?: string;
}

export async function lookupUkRegistration(registrationNumber: string): Promise<DvlaVehicleResult | null> {
  const apiKey = process.env.EXPO_PUBLIC_DVLA_API_KEY;
  if (!apiKey) {
    throw new Error('DVLA API key is missing. Add EXPO_PUBLIC_DVLA_API_KEY and restart Expo.');
  }
  const reg = registrationNumber.trim().toUpperCase().replace(/\s+/g, '');
  if (!reg) return null;

  const response = await fetch(DVLA_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ registrationNumber: reg }),
  });

  if (!response.ok) {
    let message = `DVLA lookup failed (${response.status}).`;
    try {
      const errorBody = await response.json();
      if (typeof errorBody?.message === 'string' && errorBody.message.trim()) {
        message = `${message} ${errorBody.message.trim()}`;
      }
    } catch {
      // ignore JSON parse issues and keep status-based message
    }

    if (response.status === 403) {
      throw new Error('DVLA rejected the API key (403 Forbidden). Check key activation/permissions in DVLA portal.');
    }
    throw new Error(message);
  }

  const data = await response.json();
  if (!data?.make) return null;
  return {
    make: String(data.make),
    model: data.model ? String(data.model) : undefined,
    yearOfManufacture: data.yearOfManufacture,
    engineCapacity: data.engineCapacity,
    fuelType: data.fuelType,
    colour: data.colour,
  };
}

