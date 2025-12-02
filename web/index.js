// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";
import visibilityScoreRoute from "./api/visibility-score.js";
import shopInfoRoute from "./api/shop-info.js";   // ★ ADD THIS

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

//
// 1. SHOPIFY AUTH
//
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);

//
// 2. WEBHOOKS
//
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

//
// 3. JSON PARSING
//
app.use(express.json());

//
// 4. SECURE ALL API ROUTES
//
app.use("/api/*", shopify.validateAuthenticatedSession());

//
// 5. OUR CUSTOM API ROUTES
//
app.use("/api/shop-info", shopInfoRoute);               // ★ FIXED
app.use("/api/visibility-score", visibilityScoreRoute);

//
// 6. EXAMPLE SHOPIFY PRODUCT ROUTES
//
app.get("/api/products/count", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const countData = await client.request(`
    query shopifyProductCount {
      productsCount {
        count
      }
    }
  `);

  res.status(200).send({ count: countData.data.productsCount.count });
});

app.post("/api/products", async (_req, res) => {
  try {
    await productCreator(res.locals.shopify.session);
    res.status(200).send({ success: true });
  } catch (e) {
    // @ts-ignore
    res.status(500).send({ success: false, error: e.message });
  }
});

//
// 7. STATIC FRONTEND
//
app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

//
// 8. LOAD FRONTEND
//
app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res) => {
  res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

app.listen(PORT);
