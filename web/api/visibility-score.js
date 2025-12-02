import express from "express";

const router = express.Router();

const DEFAULT_N8N_WEBHOOK_URL =
  "https://digidartsmarketing.app.n8n.cloud/webhook/shopify";

router.post("/", async (req, res) => {
  try {
    const session = res.locals.shopify?.session;

    if (!session) {
      return res.status(401).json({ error: "No Shopify session found" });
    }

    const { shop, website, brandName } = req.body || {};

    if (!shop || !website) {
      return res.status(400).json({
        error: "Missing required fields: shop and website",
        received: { shop, website, brandName },
      });
    }

    const n8nUrl = process.env.N8N_WEBHOOK_URL || DEFAULT_N8N_WEBHOOK_URL;

    if (!/^https?:\/\//i.test(n8nUrl)) {
      return res.status(500).json({
        error: "Invalid N8N_WEBHOOK_URL – must be an absolute URL",
        value: n8nUrl,
      });
    }

    const n8nResponse = await fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop, website, brandName }),
    });

    const text = await n8nResponse.text();
    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { output: text };
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("visibility-score error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
