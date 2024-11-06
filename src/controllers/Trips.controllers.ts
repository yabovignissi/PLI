import { Request, Response } from "express";
import { createTrip, updateTrip, deleteTrip } from "../services/Trips.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getAll(req: Request, res: Response) {
  try {

    const trips = await prisma.trip.findMany(); 

    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve trips" });
    console.error(error);
  }
}
export async function getTripsByUserId(req: Request, res: Response) {
  try {

    const userId= parseInt(req.params.id);
  
    const trips = await prisma.trip.findMany({
      where: { userId },
    });

    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve trips" });
    console.error("Error retrieving trips by user ID:", error);
  }
}
export async function getById(req: Request, res: Response) {
  const id = parseInt(req.params.id);

  try {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (trip) {
      res.status(200).json(trip);
    } else {
      res.status(404).json({ error: "Trip not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve trip" });
    console.error(error);
  }
}

export async function create(req: Request, res: Response) {
  try {
    await createTrip(req.body); 
    res.status(201).json({ message: "Trip created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create trip" });
    console.error(error);
  }
}

export async function updateById(req: Request, res: Response) {
  const id = parseInt(req.params.id);

  try {
    await updateTrip(id, req.body); 
    res.status(200).json({ message: "Trip updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update trip" });
    console.error(error);
  }
}

export async function deleteById(req: Request, res: Response) {
  try {
    await deleteTrip(req, res);
  } catch (error) {
    if (error instanceof Error) {
      res
        .status(500)
        .send({ error: "Step not deleted", details: error.message });
    } else {
      res.status(500).send({ error: "Unknown error occurred" });
    }
  }
}


export async function getShare(req: Request, res: Response) {
 
  const { fullName, tripId, tripName } = req.params;

  try {
      const trip = await prisma.trip.findUnique({
          where: { id: Number(tripId) },
          include: {
              steps: {
                  include: {
                      photos: true,
                      comments: true
                  },
              },
              user: true, 
          },
      });
      if (!trip || !trip.isPublic) {
          return res.status(404).json({ error: "Voyage introuvable ou privé" });
      }
      res.json({
          message: `Voici le voyage partagé par ${fullName}: ${tripName}`,
          trip,
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur lors de la récupération du voyage" });
  }
}
