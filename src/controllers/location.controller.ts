import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface JsonResponse {
  error?: string;
  message?: string;
  location?: {
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

interface LocationRequestBody {
  latitude: number;
  longitude: number;
  userId: number;
  tripId: number;
}

export async function handleLocation(
  req: Request<unknown, unknown, LocationRequestBody>, 
  res: Response<JsonResponse>
) {
  const { latitude, longitude, userId, tripId } = req.body;

  if (!latitude || !longitude || !userId || !tripId) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }

  try {
    // Convertir userId et tripId en entiers et vérifier leur validité
    const parsedUserId = parseInt(String(userId), 10);
    const parsedTripId = parseInt(String(tripId), 10);

    if (isNaN(parsedUserId) || isNaN(parsedTripId)) {
      return res.status(400).json({ error: 'userId ou tripId invalide' });
    }

    console.log("Appel de l'API Nominatim pour le géocodage inverse...");
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json'
      },
      headers: {
        'User-Agent': 'my-way/1.0.0 (aa@gmail.com)', // Custom User-Agent
      }
    });

    const city = response.data.address?.city || response.data.address?.town || response.data.address?.village;
    console.log("Ville déterminée :", city);

    if (!city) {
      return res.status(500).json({ error: 'Impossible de déterminer la ville' });
    }

    // Vérifier la dernière entrée et la durée dans la même ville
    const lastLocation = await prisma.location.findFirst({
      where: { userId: parsedUserId, tripId: parsedTripId },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    if (lastLocation && lastLocation.city === city && lastLocation.createdAt > twelveHoursAgo) {
      return res.status(200).json({ message: `Vous êtes toujours à ${city}`, location: { city, latitude, longitude } });
    }

    // Enregistrer la nouvelle localisation avec latitude et longitude
    const newLocation = await prisma.location.create({
      data: {
        city,
        latitude,
        longitude,
        userId: parsedUserId,
        tripId: parsedTripId,
      },
    });

    return res.status(201).json({ message: 'Localisation enregistrée', location: newLocation });
  } catch (error) {
    console.error('Erreur lors de la gestion de la localisation : ', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

export async function getLocation(req: Request<{ userId: string; tripId: string }>, res: Response<JsonResponse>) {
  const { userId, tripId } = req.params;

  if (!userId || !tripId) {
    return res.status(400).json({ error: 'Paramètres userId ou tripId manquants' });
  }

  try {
    const location = await prisma.location.findFirst({
      where: {
        userId: parseInt(userId, 10),
        tripId: parseInt(tripId, 10),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        city: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!location) {
      return res.status(404).json({ error: 'Aucune localisation trouvée pour cet utilisateur et ce voyage' });
    }

    return res.status(200).json({ location });
  } catch (error) {
    console.error('Erreur lors de la récupération de la localisation : ', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
export async function getAll(req: Request, res: Response) {
  try {
    const QueryResult = await prisma.location.findMany();
    res.send(JSON.stringify(QueryResult, null, 2));
  } catch (error) {
    if (error instanceof Error) {
      res
        .status(500)
        .send({ error: "Could not retrieve location", details: error.message });
    } else {
      res.status(500).send({ error: "Unknown error occurred" });
    }
  }
}

