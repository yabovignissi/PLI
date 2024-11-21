import { PrismaClient } from "@prisma/client";
import { Photos, Steps } from "../Interface";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export async function createStep(req: Request, res: Response) {
  try {
    const { tripId, stepDate, name, description, photos }: Steps & { photos?: Array<{ image: string, mimeType: string }> } = req.body;

    if (!tripId || !stepDate || !description) {
      return res.status(400).json({ error: "Les champs obligatoires sont manquants" });
    }

    const step = await prisma.step.create({
      data: {
        tripId: tripId,
        stepDate: new Date(stepDate),
        name: name,
        description: description,
      },
    });

    if (photos && photos.length > 0) {
      const photoData: Photos[] = photos.map(photo => {
        const base64Data = photo.image.replace(/^data:image\/\w+;base64,/, "");
        return {
          stepId: step.id,
          photoUrl: Buffer.from(base64Data, 'base64'),
        };
      });
      await prisma.photo.createMany({
        data: photoData,
      });
    }
    res.status(201).json({ success: true, step });
  } catch {
    res.status(500).json({ error: "Erreur lors de la création de l'étape et des photos" });
  }
}

export async function updateStep(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const { tripId, stepDate, name, description, photos }: Steps & { photos?: Array<{ image: string, mimeType: string }> } = req.body;

    const updateData: Partial<{ tripId: number; stepDate: Date; name: string; description: string }> = {};

    if (tripId) updateData.tripId = tripId;
    if (stepDate) updateData.stepDate = new Date(stepDate);
    if (name) updateData.name = name;
    if (description) updateData.description = description;

    const step = await prisma.step.update({
      where: { id },
      data: updateData,
    });

    if (photos && photos.length > 0) {
      const photoData: Photos[] = [];
      for (const photo of photos) {
        if (photo?.image) {
          const base64Data = photo.image.replace(/^data:image\/\w+;base64,/, "");
          photoData.push({
            stepId: step.id,
            photoUrl: Buffer.from(base64Data, 'base64'),
          });
        }
      }
      if (photoData.length > 0) {
        await prisma.photo.createMany({
          data: photoData,
        });
      }
    }

    const updatedStep = await prisma.step.findUnique({
      where: { id },
      include: { photos: true },
    });

    res.status(200).json({ success: true, step: updatedStep });
  } catch {
    res.status(500).json({ error: "Erreur lors de la mise à jour de l'étape et des photos" });
  }
}

export async function deleteStep(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);

    const step = await prisma.step.findUnique({ where: { id } });
    if (!step) {
      return res.status(404).json({ error: "Étape introuvable" });
    }

    await prisma.step.delete({
      where: { id },
    });
    res.status(200).json({ message: "Étape supprimée avec succès" });
  } catch {
    res.status(500).json({ error: "Erreur lors de la suppression de l'étape" });
  }
}
