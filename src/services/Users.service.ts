import { Request, Response } from "express";
import { NewPassword, User } from "../Interface";
import { PrismaClient } from "@prisma/client";
import path from "path";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

function processPic(pic: string | Buffer | null): Buffer | null {
  if (typeof pic === "string" && pic.startsWith("data:image")) {
    const base64Data = pic.replace(/^data:image\/\w+;base64,/, "");
    return Buffer.from(base64Data, "base64");
  } else if (Buffer.isBuffer(pic)) {
    return pic;
  }
  return null;
}

// CREATE USER
export async function createUser(req: Request, res: Response) {
  try {
    const datas: User = req.body;
    const hash = await bcrypt.hash(datas.password, 10);

    const QueryResult = await prisma.user.create({
      data: {
        lastName: datas.lastName,
        firstName: datas.firstName,
        email: datas.email,
        password: hash,
        address: datas.address,
        pic: processPic(datas.pic),
      },
    });

    const acces = jwt.sign(
      {
        email: datas.email,
        id: QueryResult.id,
      },
      process.env.JWT_SIGN_SECRET as string,
      { expiresIn: "24h" }
    );

    const result = {
      token: acces,
      user: {
        id: QueryResult.id,
        lastName: QueryResult.lastName,
        firstName: QueryResult.firstName,
        email: QueryResult.email,
        address: QueryResult.address,
        pic: QueryResult.pic,
        createdAt: QueryResult.createdAt,
        isVisible: QueryResult.isVisible,
      },
    };

    res.status(200).json(result);
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002") {
      const meta = (error as { meta?: { target?: string[] } }).meta;
      if (meta?.target?.includes("email")) {
        return res.status(409).json({ message: "Email already exists" });
      }
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// UPDATE PASSWORD
export async function updatePass(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const datas: NewPassword = req.body;

    if (!datas.password || !datas.new_password || !datas.repeat_password) {
      return res.status(400).send("Veuillez fournir le mot de passe actuel, le nouveau mot de passe et la confirmation du nouveau mot de passe.");
    }
    if (datas.new_password !== datas.repeat_password) {
      return res.status(400).send("Le nouveau mot de passe et la confirmation du nouveau mot de passe ne correspondent pas.");
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).send("Utilisateur non trouvé.");
    }

    const isPasswordValid = await bcrypt.compare(datas.password, user.password);
    if (!isPasswordValid) {
      return res.status(400).send("Le mot de passe actuel est incorrect.");
    }

    const hashedNewPassword = await bcrypt.hash(datas.new_password, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedNewPassword },
    });

    res.status(200).send("Mot de passe mis à jour avec succès.");
  } catch {
    res.status(500).send("Une erreur est survenue lors de la mise à jour du mot de passe.");
  }
}

// UPDATE USER
export async function updateUser(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const datas: User = req.body;

    let hash;
    if (datas.password) {
      hash = await bcrypt.hash(datas.password, 10);
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).send("User not found");
    }

    await prisma.user.update({
      data: {
        lastName: datas.lastName || existingUser.lastName,
        firstName: datas.firstName || existingUser.firstName,
        email: datas.email || existingUser.email,
        password: hash || undefined,
        address: datas.address || existingUser.address,
        pic: processPic(datas.pic) || existingUser.pic,
      },
      where: { id },
    });

    const updatedUser = await prisma.user.findUnique({ where: { id } });
    res.status(200).json(updatedUser);
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
}

// DELETE USER
export async function deleteUser(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).send("Invalid user ID");
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).send("User not found");
    }

    await prisma.user.delete({ where: { id } });
    res.status(200).send("User deleted");
  } catch (error) {
    res.status(500).send("Une erreur est survenue lors de la suppression de l'utilisateur.");
  }
}


// UPLOAD PROFILE PICTURE
export async function uploadProfilePicture(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.id);
    const { image, mimeType } = req.body;

    if (!image || !mimeType) {
      return res.status(400).json({ message: "No image or MIME type provided" });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const fileData = Buffer.from(base64Data, "base64");

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { pic: fileData, picType: mimeType },
    });

    res.status(200).json({ success: true, message: "Profile picture uploaded successfully", data: updatedUser });
  } catch {
    res.status(500).json({ success: false, message: "Failed to upload profile picture" });
  }
}

// GET PROFILE PICTURE
export async function getProfilePicture(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pic: true, picType: true },
    });

    if (user?.pic && user?.picType) {
      res.contentType(user.picType);
      res.send(user.pic);
    } else {
      const defaultImagePath = path.join(__dirname, "../../public/images/profile.jpg");
      res.sendFile(defaultImagePath);
    }
  } catch {
    res.status(500).json({ success: false, message: "Échec de la récupération de la photo de profil" });
  }
}
