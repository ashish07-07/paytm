const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const app = express();

const JWT_SECRET = require("../config");
const { User } = require("../db");

const { Account } = require("../db");
const authmiddleware = require("../middleware");
app.use(express.json());
const zod = require("zod");
const userschema = zod.object({
  firstname: zod.string(),
  lastname: zod.string(),
  username: zod.string().email(),
  password: zod.string(),
});

const Signinschema = zod.object({
  username: zod.string(),
  password: zod.string(),
});

const Updateschema = zod.object({
  firstname: zod.string(),
  lastname: zod.string(),
  password: zod.string(),
});

router.post("/signup", async function (req, res) {
  console.log("hi");
  const body = req.body;

  const parsedsucesss = userschema.safeParse(body);
  if (!parsedsucesss) {
    return res.status(411).json({
      msg: "invalid input have been entered",
    });
  }

  const user = await User.findOne({
    username: req.body.username,
  });
  if (user) {
    return res.status(401).json({
      msg: "username already exist other username",
    });
  }

  const dbuser = await User.create(req.body);

  await Account.create({
    userId: dbuser._id,
    balance: 1 + Math.random() * 1000,
  });

  const token = jwt.sign(
    {
      userId: dbuser._id,
    },
    JWT_SECRET
  );

  res.json({
    msg: "user created successfully",
    token: token,
  });
});

router.post("/signin", async function (req, res) {
  const body = req.body;

  const succ = Signinschema.safeParse(req.body);
  if (!succ) {
    return res.status(401).json({
      msg: "enter valid ",
    });
  }
  const user = await User.findOne({
    username: req.body.username,
    password: req.body.password,
  });

  if (user) {
    // return res.status(411).json({
    //   msg: " error while logging in",
    // });
    const token = jwt.sign(
      {
        userId: user._id,
      },
      JWT_SECRET
    );
    res.status(200).json({
      msg: "success ",
      token: token,
    });
  } else {
    res.status(401).json({
      msg: "enter the valid credientials",
    });
  }
});

router.put("/update", authmiddleware, async function (req, res) {
  const parsedbody = Updateschema.safeParse(req.body);
  if (!parsedbody) {
    return res.status(401).json({
      msg: "invalid inputs passed",
    });
  }
  await User.updateOne(req.body, {
    _id: req.userId,
  });
  res.json({
    msg: "updated succesfully",
  });
});

router.get("/bulk", async function (req, res) {
  const filter = req.query.filter || "";
  const users = await User.find({
    $or: [
      {
        firstname: {
          $regex: filter,
        },
      },
      {
        lastname: {
          $regex: filter,
        },
      },
    ],
  });

  res.json({
    user: users.map((user) => ({
      username: user.username,
      firstName: user.firstname,
      lastName: user.lastname,
      _id: user._id,
    })),
  });
});

module.exports = router;
