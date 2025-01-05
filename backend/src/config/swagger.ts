import swaggerAutogen from "swagger-autogen";
import { PORT } from "./env";

const doc = {
    info: {
        title: "TeXCraft API", 
        description: "API for TeXCraft LaTeX editor",
    }, 
    host: `localhost:${PORT}`,
    schemes: ['http'],
}

const outputFile = "./config/swagger-output.json";
const endpointsFiles = ["./index.ts"];

swaggerAutogen()(outputFile, endpointsFiles, doc);