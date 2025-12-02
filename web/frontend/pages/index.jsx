import { useState, useEffect } from "react";
import { Card, Page, Button, Text } from "@shopify/polaris";

export default function HomePage() {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Load shop domain from backend
  useEffect(() => {
    async function loadShop() {
      try {
        const res = await fetch("/api/shop-info");
        const data = await res.json();

        if (data?.shop) {
          setShop(data.shop);
        } else {
          console.warn("Shop not returned", data);
        }
      } catch (err) {
        console.error("Failed to load shop", err);
      }
    }

    loadShop();
  }, []);

  async function fetchScore() {
    if (!shop) {
      setResult({ error: "Shop not loaded yet" });
      return;
    }

    setLoading(true);

    const res = await fetch("/api/visibility-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shop,
        brandName: shop.replace(".myshopify.com", ""),
        website: `https://${shop}`,
      }),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <Page title="AI Visibility Score">
      <Card sectioned>
        <Button
          onClick={fetchScore}
          loading={loading}
          primary
          disabled={!shop}
        >
          {shop ? "Calculate Visibility Score" : "Loading shop…"}
        </Button>
      </Card>

      <Card title="Your AI Visibility Score" sectioned>
        {result?.output ? (
  <pre style={{ whiteSpace: "pre-wrap", fontSize: "14px" }}>
    {result.output}
  </pre>
) : (
  <pre>{JSON.stringify(result, null, 2)}</pre>
)}
      </Card>
    </Page>
  );
}
