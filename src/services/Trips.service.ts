import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function createTrip(data: {
  name: string;
  summary: string;
  startDate: Date;
  endDate: Date;
  country: string; 
  userId: number; 
  isPublic?: boolean;
}) {
  return await prisma.trip.create({
    data: {
      name: data.name,
      summary: data.summary,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      country: data.country, 
      userId: data.userId,
      isPublic: data.isPublic ?? false,
    },
  });
}

export async function updateTrip(id: number, data: {
  name?: string;
  summary?: string;
  startDate?: Date;
  endDate?: Date;
  country?: string; 
  isPublic?: boolean;
}) {
  try {
    const shareToken = data.isPublic ? uuidv4() : undefined;
    return await prisma.trip.update({
      where: { id },
      data: {
        name: data.name,
        summary: data.summary,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        country: data.country,
        isPublic: data.isPublic,
        shareToken
      },
    });
  } catch (error) {
    throw new Error("Erreur lors de la mise à jour du voyage");
  }
}

export async function deleteTrip(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).send("Invalid trip ID");
    }

    const tripExists = await prisma.trip.findUnique({ where: { id } });
    if (!tripExists) {
      return res.status(404).send("Voyage introuvable");
    }

    await prisma.photo.deleteMany({
      where: {
        step: {
          tripId: id,
        },
      },
    });

    await prisma.comment.deleteMany({
      where: {
        step: {
          tripId: id,
        },
      },
    });

    await prisma.step.deleteMany({
      where: {
        tripId: id,
      },
    });

    await prisma.location.deleteMany({
      where: {
        tripId: id,
      },
    });

    await prisma.trip.delete({
      where: {
        id: id,
      },
    });

    res.status(200).send("Voyage supprimé avec succès");
  } catch (error) {
    res.status(500).send("Erreur lors de la suppression du voyage");
  }
}
