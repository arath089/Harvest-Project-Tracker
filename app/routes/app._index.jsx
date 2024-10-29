import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { Page, Layout, Text, Card, BlockStack } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  try {
    const response = await fetch(
      "https://api.harvestapp.com/api/v2/users/me.json",
      {
        headers: {
          Authorization: `Bearer ${process.env.HARVEST_API_TOKEN}`,
          "Harvest-Account-ID": process.env.HARVEST_ACCOUNT_ID,
          "User-Agent": "Harvest Project Tracker (your_email@example.com)",
        },
      },
    );

    if (!response.ok) {
      console.error(
        "Harvest API Response:",
        response.status,
        response.statusText,
      );
      throw new Error("Failed to fetch data from Harvest API");
    }

    const data = await response.json();
    return json({ user: data });
  } catch (error) {
    console.error("Error fetching data from Harvest API:", error);
    throw new Error("Failed to fetch data from Harvest API");
  }
};

export default function Index() {
  const { user } = useLoaderData();

  return (
    <Page>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <Text as="h1" variant="heading3xl">
                  Harvest Project Tracker
                </Text>
                <Text as="h2" variant="headingLg">
                  User Information
                </Text>
                {user ? (
                  <div>
                    <Text as="p">
                      Name: {user.first_name} {user.last_name}
                    </Text>
                    <Text as="p">Email: {user.email}</Text>
                  </div>
                ) : (
                  <Text as="p">No user data available.</Text>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
