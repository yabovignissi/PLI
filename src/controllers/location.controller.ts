import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface JsonResponse {
  error?: string;
  message?: string;
  location?: {
    city?: string;
  };
}

// Interface pour le corps de la requête
interface LocationRequestBody {
  latitude: number;
  longitude: number;
  userId: number;
  tripId: number;
}

// Utilisation de `unknown` pour éviter l'erreur avec `{}` dans Request
export async function handleLocation(
  req: Request<unknown, unknown, LocationRequestBody>, 
  res: Response<JsonResponse>
) {
  const { latitude, longitude, userId, tripId } = req.body;

  if (!latitude || !longitude || !userId || !tripId) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }

  try {
    // Géocodage inverse pour obtenir la ville
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json'
      }
    });

    const city = response.data.address?.city || response.data.address?.town || response.data.address?.village;

    if (!city) {
      return res.status(500).json({ error: 'Impossible de déterminer la ville' });
    }

    // Vérifier la dernière entrée et la durée dans la même ville
    const lastLocation = await prisma.location.findFirst({
      where: { userId, tripId },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 heures en millisecondes

    // Si l'utilisateur est dans la même ville depuis moins de 12 heures, renvoie la ville actuelle
    if (lastLocation && lastLocation.city === city && lastLocation.createdAt > twelveHoursAgo) {
      return res.status(200).json({ message: `Vous êtes toujours à ${city}`, location: { city } });
    }

    // Enregistrer la nouvelle localisation
    const newLocation = await prisma.location.create({
      data: {
        city,
        userId,
        tripId,
      },
    });

    return res.status(201).json({ message: 'Localisation enregistrée', location: newLocation });
  } catch (error) {
    console.error('Erreur lors de la gestion de la localisation : ', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function getLocation(req: Request<{ userId: string }>, res: Response<JsonResponse>) {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'ID utilisateur manquant' });
  }

  try {
    const location = await prisma.location.findFirst({
      where: { userId: parseInt(userId, 10) },
      orderBy: { createdAt: 'desc' },
      select: {
        city: true,
      },
    });

    if (!location) {
      return res.status(404).json({ error: 'Aucune localisation trouvée pour cet utilisateur' });
    }

    return res.status(200).json({ location });
  } catch (error) {
    console.error('Erreur lors de la récupération de la localisation : ', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
