import { prisma } from ".";
import { Request, Response } from "express";

export const returnUser = async (req: Request, res: Response) => {
  try {
    const { email, useremail } = req.body;

    prisma.user
      .findFirst({
        where: { email: email },
      })
      .then((e) => {
        if (e) {
          if (e.email != useremail)
            return res.status(200).json({
              data: { name: e.name, email: e.email },
              message: "User Found",
            });
          else
            return res.status(200).json({
              data: false,
              message: "You should not pass your email",
            });
        } else
          return res
            .status(200)
            .json({ data: false, message: "User Not Found" });
      })
      .catch((e) => {
        return res.status(500).json({ data: {}, message: e });
      });
  } catch (error) {
    console.log(error);
  }
};
