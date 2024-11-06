
import {
    getAll,
    getById,
    register,
    login,
    updateById,
    deleteById,
    updatePassword, 
    updateProfile,
    getProfile,
    searchUsers,
    getUserTripsBySearch,
    
  } from "../controllers/Users.controllers";
  import authenticateJWT from "../middlewares/authenticateJWT";
import { upload } from "../middlewares/multer";

import { validate, validateUserRegistration } from "../validators/User.validators";



  import express from "express";

  const routerusers = express();

routerusers.get("/users/", getAll);
routerusers.get("/users/:id", getById);
routerusers.get("/search/",authenticateJWT, searchUsers);
routerusers.get("/users/:id/trips",authenticateJWT, getUserTripsBySearch);
routerusers.post("/users/register/", validateUserRegistration, validate, register);
routerusers.post("/users/auth/", login);
routerusers.put("/users/:id", authenticateJWT, updateById);
routerusers.put("/users/:id/profil", authenticateJWT, upload.single('pic'),  updateProfile);
routerusers.get('/users/:id/profil', getProfile);
routerusers.delete("/users/:id", authenticateJWT, deleteById);
routerusers.put("/users/password/:id", authenticateJWT, updatePassword);
  export default routerusers;