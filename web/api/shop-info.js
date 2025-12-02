import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const session = res.locals.shopify?.session;

    if (!session || !session.shop) {
      return res.status(400).json({ shop: null, error: "No session available" });
    }

    return res.status(200).json({ shop: session.shop });
  } catch (err) {
    console.error("shop-info error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
