import serverless from "serverless-http";
import { createApp } from "../server/_core/index";

const app = createApp();

export default serverless(app);