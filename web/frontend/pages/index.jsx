import { useState, useEffect } from "react";
import { Card, Page, Button, Text } from "@shopify/polaris";

export default function HomePage() {
  const [shopInfo, setShopInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(null);
  const [error, setError] = useState(null);

  // 1. Load shop / brand / website from backend
  useEffect(() => {
    async function loadShop() {
      try {
        const res = await fetch("/api/shop-info");
        const data = await res.json();

        if (data?.error) {
          console.error("shop-info error:", data.error);
          setError(data.error);
        } else if (data?.shop) {
          setShopInfo(data);
        }
      } catch (err) {
        console.error("Failed to load shop info", err);
        setError("Could not load shop information.");
      }
    }

    loadShop();
  }, []);

  // 2. Call visibility-score API
  async function fetchScore() {
    if (!shopInfo) {
      setError("Shop not loaded yet.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/visibility-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop: shopInfo.shop,
          brandName:
            shopInfo.brandName ||
            shopInfo.shop.replace(".myshopify.com", ""),
          website:
            shopInfo.website || `https://${shopInfo.shop}`,
        }),
      });

      const data = await res.json();
      setResult(data);

      // Try to extract the main % score from the output
      if (data?.output) {
        const match = data.output.match(/(\d+)%/);
        setScore(match ? match[1] : null);
      } else {
        setScore(null);
      }
    } catch (err) {
      console.error("visibility-score error:", err);
      setError("Something went wrong while calculating the score.");
    } finally {
      setLoading(false);
    }
  }

  const output = result?.output || "";

  return (
    <Page title="AI Visibility Score">
      {/* Top card with CTA */}
      <Card sectioned>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1.5rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: 480 }}>
            <Text variant="headingMd" as="h2">
              Measure how visible your brand is across AI search engines
            </Text>
            <Text as="p">
              We use your store name and primary website to estimate how often
              AI assistants surface your brand compared to competitors.
            </Text>
          </div>

          <Button
            onClick={fetchScore}
            loading={loading}
            primary
            disabled={!shopInfo}
          >
            {shopInfo ? "Calculate Visibility Score" : "Loading shop…"}
          </Button>
        </div>
      </Card>

      {/* Results card */}
      <Card title="Your AI Visibility Score" sectioned>
        {/* Store / brand summary */}
        {shopInfo && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 8,
              background: "#f6f6f7",
            }}
          >
            <Text as="p">
              <strong>Store:</strong> {shopInfo.shop}
            </Text>
            <Text as="p">
              <strong>Brand:</strong> {shopInfo.brandName}
            </Text>
            <Text as="p">
              <strong>Website:</strong> {shopInfo.website}
            </Text>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            style={{
              marginBottom: 12,
              padding: 10,
              borderRadius: 6,
              background: "#fbeae5",
            }}
          >
            <Text as="p">
              <strong>Error:</strong> {error}
            </Text>
          </div>
        )}

        {/* Big score */}
        {score && (
          <div style={{ marginBottom: 16 }}>
            <Text variant="heading4xl" as="p">
              {score}%
            </Text>
            <Text as="p">Overall AI Visibility Score</Text>
          </div>
        )}

        {/* Detailed report */}
        {output ? (
          <div
            style={{
              marginTop: 8,
              padding: 12,
              borderRadius: 8,
              background: "#f9fafb",
              maxHeight: 400,
              overflowY: "auto",
              fontFamily:
                "SFMono-Regular, ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: 13,
              whiteSpace: "pre-wrap",
            }}
          >
            {output}
          </div>
        ) : !error ? (
          <Text as="p">
            No report generated yet. Click{" "}
            <strong>“Calculate Visibility Score”</strong> to run your first
            analysis.
          </Text>
        ) : null}
      </Card>
    </Page>
  );
}
