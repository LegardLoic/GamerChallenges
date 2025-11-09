import type { Request, Response } from "express";

export const healthController = {
  // --------------------  Checking ------------------------
  async checking(_req: Request, res: Response) {
    res.status(200).json({
      message: "All good here!",
      timestamp: new Date().toISOString(),
    });
  },
};

export default healthController;
