import { createUser,updateUser,deleteUser, updatePass, uploadProfilePicture, getProfilePicture } from "../services/Users.service";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();
import { Photo, Step, Trip, User } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { validationResult } from 'express-validator';
import { validateUserRegistration } from '../validators/User.validators'; 

export async function getAll(req: Request, res: Response) {
    const QueryResult = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        address: true,
        email:true
      },
    });
    res.send(JSON.stringify(QueryResult, null, 2));
  }
  
  // GET BY ID
  export async function getById(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
    });

 
    res.send(JSON.stringify(user, null, 2));
  }

  type UserWithTrips = User & {
    trips: (Trip & {
        steps: (Step & {
            photos: Photo[];
        })[];
    })[];
};

export async function searchUsers(req: Request, res: Response) {
  const { query } = req.query;
  try {
    if (query && typeof query !== 'string') {
      return res.status(400).send("Error: Query must be a string");
    }
    const filter: {
      OR?: { firstName?: { contains: string }; lastName?: { contains: string } }[];
    } = {};

    if (query) {
      filter.OR = [
        { firstName: { contains: query } },
        { lastName: { contains: query } },
      ];
    }

    console.log("Filter used for search:", filter);

    const users = await prisma.user.findMany({
      where: filter,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        address: true,
      },
    });

    console.log("Retrieved Users:", users);

    if (users.length === 0) {
      return res.status(404).send("No users found with the given criteria");
    }
    res.json(users);
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).send("Internal server error");
  }
}


export async function getUserTripsBySearch(req: Request, res: Response) {
  const userId = parseInt(req.params.id); 

  try {
    if (!userId) {
      return res.status(400).send("User ID is required");
    }
    const userWithTrips: UserWithTrips | null = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        trips: {
          include: {
            steps: {
              include: {
                photos: true, 
              },
            },
          },
        },
      },
    });
    if (!userWithTrips) {
      return res.status(404).send("User not found");
    }
    const publicTrips = userWithTrips.trips.filter(trip => trip.isPublic);
    const response = {
      id: userWithTrips.id,
      firstName: userWithTrips.firstName,
      lastName: userWithTrips.lastName,
      trips: publicTrips.map(trip => ({
        id: trip.id,
        name: trip.name,
        summary: trip.summary,
        startDate: trip.startDate,
        endDate: trip.endDate,
        country: trip.country, 
        userId: trip.userId,
        isPublic: trip.isPublic,
        steps: JSON.stringify(trip.steps.map(step => ({
          id: step.id,
          name: step.name,
          description: step.description,
          photos: step.photos.map(photo => ({
            photoUrl: photo.photoUrl,
          })),
        }))), 
      })),
    };
    res.json(response);
  } catch (error) {
    console.error("Error occurred:", error); 
    res.status(500).send("Internal server error");
  }
}


  

  
// CREATE USER
export async function register(req: Request, res: Response) {
  await Promise.all(validateUserRegistration.map((validation) => validation.run(req)));
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => error.msg);
    return res.status(400).json({ errors: formattedErrors });
  }
  try {
    await createUser(req, res);
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({ message: "Erreur lors de la création de l'utilisateur" });
  }
}
// UPDATE USER
export async function updateById(req: Request, res: Response) {
    try {
      await updateUser(req, res);
    } catch (error) {
      console.log("une erreur est survenue lors de la mise a jour d'un user", error)
      res.send("User has been updated");
    }
  }
  
  export async function updateProfile(req: Request, res: Response) {
    try {
      await uploadProfilePicture(req, res);
    } catch (error) {
      console.log("Une erreur est survenue lors de la mise a jour de photo ", error)
      res.send("User profil picture has been updated");
    }
  }
  export async function getProfile(req: Request, res: Response) {
    try {
      await getProfilePicture(req, res);
    } catch (error) {
      console.log("Une erreur est survenue lors de l'affichage de photo ", error)
      res.send("User profil picture has been updated");
    }
  }
  // DELETE USER
  export async function deleteById(req: Request, res: Response) {
    try {
      await deleteUser(req, res);
    } catch (error) {
      console.log("Une erreur est survenue lors de la suppression de l'utilisateur ", error)
      res.send("User not delete");
      console.log(error);
    }
  }

  
  
  export async function login(req: Request, res: Response) {
    const body = req.body;
  
    try {
      const QueryResult = await prisma.user.findUnique({
        where: { email: body.email },
      });
  
      if (!QueryResult) {
        return res.status(404).send("Error: email or password incorrect");
      }
  
      const isPasswordValid = await bcrypt.compare(body.password, QueryResult.password);
      if (!isPasswordValid) {
        return res.status(404).send("Error: email or password incorrect");
      }
  
      const jwtSecret = process.env.JWT_SIGN_SECRET;
      if (!jwtSecret) {
        console.error("JWT secret is undefined");
        return res.status(500).send("Internal server error: JWT secret is missing");
      }
  
      const token = jwt.sign(
        {
          email: QueryResult.email,
          id: QueryResult.id,
        },
        jwtSecret,
        {
          expiresIn: "48h",
        }
      );

      const result = { token: token, id: QueryResult.id };
      return res.status(200).json(result);
    } catch (error) {
      console.error("Error in login:", error);
      return res.status(500).send("Internal server error");
    }
  }
  
  export async function updatePassword(req: Request, res: Response) {
    try {
      await updatePass(req, res);
    } catch (error) {
      console.log("une erreur est survenue lors de la mise a jour du mot de passe",error)
      res.send("Password user has been updated");
    }
  }
  