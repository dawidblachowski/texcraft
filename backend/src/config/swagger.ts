import swaggerAutogen from "swagger-autogen";
import { PORT } from "./env";

const doc = {
    info: {
        title: "TeXCraft API", 
        description: "API for TeXCraft LaTeX editor",
    }, 
    host: `localhost:${PORT}`,
    schemes: ['http'],
    securityDefinitions: {
        bearerAuth: {
            type: "apiKey",
            name: "Authorization",
            in: "header",
            description: "Enter your bearer token in the format **Bearer &lt;token>**"
        }
    },
    security: [
        {
            bearerAuth: []
        }
    ]
}

const outputFile = "./swagger-output.json";
const endpointsFiles = ["../index.ts"];

swaggerAutogen()(outputFile, endpointsFiles, doc);