// web/api/shop-info.js
import express from "express";
import shopify from "../shopify.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const session = res.locals.shopify?.session;

    if (!session) {
      return res.status(401).json({ error: "No Shopify session found" });
    }

    const client = new shopify.api.clients.Graphql({ session });

    const response = await client.request(`
      {
        shop {
          name
          primaryDomain {
            url
          }
        }
      }
    `);

    const shopData = response?.data?.shop;

    const shop = session.shop;
    const brandName =
      shopData?.name || shop.replace(".myshopify.com", "");
    const website =
      shopData?.primaryDomain?.url || `https://${shop}`;

    return res.json({ shop, brandName, website });
  } catch (err) {
    console.error("shop-info error:", err);
    return res.status(500).json({ error: err.message || "Unknown error" });
  }
});

export default router;
