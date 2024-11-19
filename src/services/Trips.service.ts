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
  const shareToken = data.isPublic ? uuidv4() : null;
  return prisma.trip.create({
    data: {
      name: data.name,
      summary: data.summary,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      country: data.country, 
      userId: data.userId,
      isPublic: data.isPublic ?? false,
      shareToken
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
  const shareToken = data.isPublic ? uuidv4() : undefined;
  return prisma.trip.update({
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
}

export async function deleteTrip(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
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

    res.send("Voyage supprimé avec succès");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Erreur lors de la suppression :", error.message);
    } else {
      console.error("Erreur inconnue lors de la suppression");
    }
    res.status(500).send("Erreur lors de la suppression du voyage");
  }
}