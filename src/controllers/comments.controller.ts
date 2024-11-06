import { Request, Response } from "express";
import { createComments, updateComment, deleteComment } from "../services/comments.service";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getAll(req: Request, res: Response) {
  const QueryResult = await prisma.comment.findMany();
  res.send(JSON.stringify(QueryResult, null, 2));
}

export async function getCommentsByStepId(req: Request, res: Response) {
  try {
    const stepId = parseInt(req.params.id);

    const comments = await prisma.comment.findMany({
      where: {
        stepId: stepId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            // pic: true
          },
        },
      },
    });

    res.json(comments);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching comments:", error.message);
      res.status(500).json({ error: "Error fetching comments for step" });
    } else {
      res.status(500).json({ error: "An unknown error occurred" });
    }
  }
}

export async function getById(req: Request, res: Response) {
  const id = parseInt(req.params.id);
  const QueryResult = await prisma.comment.findUnique({
    where: { id },
  });
  res.send(JSON.stringify(QueryResult, null, 2));
}

export async function create(req: Request, res: Response) {
  try {
    await createComments(req, res);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).send("Comment not created");
  }
}

export async function updateById(req: Request, res: Response) {
  try {
    await updateComment(req, res);
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).send("Comment update failed");
  }
}

export async function deleteById(req: Request, res: Response) {
  try {
    await deleteComment(req, res);
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).send("Comment deletion failed");
  }
}
