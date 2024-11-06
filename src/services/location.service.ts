import nominatim from 'nominatim-client';

class LocationService {
  async getCityFromCoordinates(latitude: string, longitude: string) {
    const params = {
      lat: latitude,
      lon: longitude,
      zoom: 10,
      addressdetails: 1,
    };

    try {
      const result = await (nominatim as unknown as { reverse: (params: unknown) => Promise<{ address: { city?: string; town?: string; village?: string } }> }).reverse(params);
      return result.address.city || result.address.town || result.address.village;
    } catch (error) {
      console.error('Erreur lors de la récupération de la ville : ', error);
      return null;
    }
  }
}

export default new LocationService();
