import { Request, Response } from "express";
import { createStep, updateStep, deleteStep } from "../services/Steps.service";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getAll(req: Request, res: Response) {
  try {
    const QueryResult = await prisma.step.findMany();
    res.send(JSON.stringify(QueryResult, null, 2));
  } catch (error) {
    if (error instanceof Error) {
      res
        .status(500)
        .send({ error: "Could not retrieve steps", details: error.message });
    } else {
      res.status(500).send({ error: "Unknown error occurred" });
    }
  }
}

export async function getStepsByTripId(req: Request, res: Response) {
  try {
    const tripId = parseInt(req.params.tripId);
    const steps = await prisma.step.findMany({
      where: { tripId: tripId },
      include: {
        photos: true, 
        comments: true,
      },
      
    });
    res.send(JSON.stringify(steps, null, 2));
  } catch (error) {
    if (error instanceof Error) {
      res
        .status(500)
        .send({ error: "Could not retrieve steps", details: error.message });
    } else {
      res.status(500).send({ error: "Unknown error occurred" });
    }
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const QueryResult = await prisma.step.findUnique({
      where: { id },
    });
    res.send(JSON.stringify(QueryResult, null, 2));
  } catch (error) {
    if (error instanceof Error) {
      res
        .status(500)
        .send({ error: "Could not retrieve step", details: error.message });
    } else {
      res.status(500).send({ error: "Unknown error occurred" });
    }
  }
}

export async function create(req: Request, res: Response) {
  try {
    await createStep(req, res);
  } catch (error) {
    if (error instanceof Error) {
      res
        .status(500)
        .send({ error: "Step not created", details: error.message });
    } else {
      res.status(500).send({ error: "Unknown error occurred" });
    }
  }
}

export async function updateById(req: Request, res: Response) {
  try {
    await updateStep(req, res);
  } catch (error) {
    if (error instanceof Error) {
      res
        .status(500)
        .send({ error: "Step not updated", details: error.message });
    } else {
      res.status(500).send({ error: "Unknown error occurred" });
    }
  }
}

export async function deleteById(req: Request, res: Response) {
  try {
    await deleteStep(req, res);
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
