import type { Request, Response } from "express";

export async function addEmailToList(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { email } = req.body as { email: string };
    console.log(`Adding ${email} to marketing list...`);
    res.status(201).json({ success: true, data: true, error: {} });
  } catch {
    res
      .status(500)
      .json({ error: "ServerError", data: undefined, success: false });
  }
}
