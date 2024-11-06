import routerusers from "./routes/users.routes";
import routerTrips from "./routes/trips.routes";
import routerSteps from "./routes/steps.routes";
import routerPhotos from "./routes/photos.routes";
import routerComments from "./routes/comments.routes";
import routerLocation from "./routes/location.routes";
import * as dotenv from "dotenv";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import * as swaggerDocument from "../swagger.json"; 

const app = express();
const port = 8000;

dotenv.config();

if (!process.env.JWT_SIGN_SECRET) {
  throw new Error("FATAL ERROR: JWT_SIGN_SECRET is not defined.");
}

app.use(cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/", routerusers);
app.use("/", routerTrips);
app.use("/", routerSteps);
app.use("/", routerPhotos);
app.use("/", routerComments);
app.use("/", routerLocation);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
