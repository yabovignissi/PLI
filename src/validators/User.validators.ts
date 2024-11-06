import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateUserRegistration = [
  body('firstName')
    .notEmpty()
    .withMessage('Le prénom est requis')
    .isLength({ min: 2 ,  max: 50})
    .withMessage('Le prénom doit contenir au moins 2 caractères'),
  
  body('lastName')
    .notEmpty()
    .withMessage('Le nom de famille est requis')
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom de famille doit contenir au moins 2 caractères'),

  body('email')
    .isEmail()
    .withMessage('L\'email est invalide')
    .normalizeEmail(),

    body('password')
    .isLength({ min: 8 ,  max: 50})
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/[A-Z]/)
    .withMessage('Le mot de passe doit contenir au moins une lettre majuscule')
    .matches(/[0-9]/)
    .withMessage('Le mot de passe doit contenir au moins un chiffre')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Le mot de passe doit contenir au moins un caractère spécial'),
  
  body('adress')
    .optional()
    .isString()
    .withMessage('L\'adresse doit être une chaîne de caractères'),
];

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
