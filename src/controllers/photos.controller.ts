import { Request, Response } from "express";
import { createPhoto, updatePhoto, deletePhoto } from "../services/photos.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getAll(req: Request, res: Response) {
  const QueryResult = await prisma.photo.findMany();
  res.send(JSON.stringify(QueryResult, null, 2));
}

export async function getById(req: Request, res: Response) {
  try {
    const photoId = parseInt(req.params.id);
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      select: {
        photoUrl: true,
      },
    });

    if (photo && photo.photoUrl) {
      res.contentType("image/jpeg");
      res.send(Buffer.from(photo.photoUrl)); // Sending the buffer directly if not null
    } else {
      res.status(404).json({ success: false, message: "Photo not found" });
    }
  } catch (error) {
    console.error("Error retrieving photo:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve photo" });
  }
}

export async function create(req: Request, res: Response) {
  try {
    await createPhoto(req, res);
  } catch (error) {
    res.send("Photo not created");
    console.log(error);
  }
}

export async function updateById(req: Request, res: Response) {
  try {
    await updatePhoto(req, res);
  } catch (error) {
    console.log("Erreur lors de la mise à jour de la photo", error);
    res.send("Photo has been updated");
  }
}

export async function deleteById(req: Request, res: Response) {
  try {
    await deletePhoto(req, res);
  } catch (error) {
    res.send("Photo not deleted");
    console.log(error);
  }
}
