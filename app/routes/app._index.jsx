import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { Page, Layout, Text, Card, BlockStack, List } from "@shopify/polaris";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  try {
    // Fetch user data from Harvest API
    const userResponse = await fetch(
      "https://api.harvestapp.com/api/v2/users/me",
      {
        headers: {
          Authorization: `Bearer ${process.env.HARVEST_API_TOKEN}`,
          "Harvest-Account-ID": process.env.HARVEST_ACCOUNT_ID,
          "User-Agent": "Harvest Project Tracker (your_email@example.com)",
        },
      },
    );

    if (!userResponse.ok) {
      console.error("User API Response Status:", userResponse.status);
      console.error("User API Response Status Text:", userResponse.statusText);
      const errorText = await userResponse.text();
      console.error("User API Response Text:", errorText);
      throw new Error("Failed to fetch user data from Harvest API");
    }

    const userData = await userResponse.json();

    // Fetch time entries from Harvest API
    const timeEntriesResponse = await fetch(
      "https://api.harvestapp.com/api/v2/time_entries",
      {
        headers: {
          Authorization: `Bearer ${process.env.HARVEST_API_TOKEN}`,
          "Harvest-Account-ID": process.env.HARVEST_ACCOUNT_ID,
          "User-Agent": "Harvest Project Tracker (your_email@example.com)",
        },
      },
    );

    if (!timeEntriesResponse.ok) {
      console.error(
        "Time Entries API Response Status:",
        timeEntriesResponse.status,
      );
      console.error(
        "Time Entries API Response Status Text:",
        timeEntriesResponse.statusText,
      );
      const errorText = await timeEntriesResponse.text();
      console.error("Time Entries API Response Text:", errorText);
      throw new Error("Failed to fetch time entries from Harvest API");
    }

    const timeEntriesData = await timeEntriesResponse.json();

    return json({ user: userData, timeEntries: timeEntriesData.time_entries });
  } catch (error) {
    console.error("Error fetching data from Harvest API:", error);
    throw new Error("Failed to fetch data from Harvest API");
  }
};

export default function Index() {
  const { user, timeEntries } = useLoaderData();

  return (
    <Page>
      <BlockStack gap="500">
        <Layout>
          {/* User Information Section */}
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

          {/* Time Entries Section */}
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <Text as="h2" variant="headingLg">
                  Time Entries
                </Text>
                <List>
                  {timeEntries.map((entry) => (
                    <List.Item key={entry.id}>
                      <Text as="p" variant="headingMd">
                        {entry.project.name} - {entry.task.name}
                      </Text>
                      <Text as="p">Hours: {entry.hours}</Text>
                      <Text as="p">Notes: {entry.notes || "No notes"}</Text>
                      <Text as="p">
                        Date: {new Date(entry.spent_date).toLocaleDateString()}
                      </Text>
                    </List.Item>
                  ))}
                </List>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
