import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  List,
  DatePicker,
} from "@shopify/polaris";
import { useState } from "react";
import { format } from "date-fns";

const PACIFIC_TZ = "America/Los_Angeles";

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

    // Fetch time entries with Pacific Time zone specified
    const timeEntriesResponse = await fetch(
      "https://api.harvestapp.com/api/v2/time_entries?timezone=America/Los_Angeles",
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

  // State for selected date in the DatePicker
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Format selectedDate to "yyyy-MM-dd" for filtering
  const formattedSelectedDate = format(selectedDate, "yyyy-MM-dd");

  // Filter time entries by selected date
  const filteredEntries = timeEntries.filter((entry) => {
    return entry.spent_date === formattedSelectedDate;
  });

  // Handle date selection change
  const handleDateChange = (date) => {
    setSelectedDate(new Date(date.start));
  };

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
                    <Text as="p">Timezone: {PACIFIC_TZ}</Text>
                  </div>
                ) : (
                  <Text as="p">No user data available.</Text>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Date Picker Section */}
          <Layout.Section>
            <Card title="Select Date">
              <DatePicker
                month={selectedDate.getMonth()}
                year={selectedDate.getFullYear()}
                onChange={handleDateChange}
                onMonthChange={(month, year) =>
                  setSelectedDate(new Date(year, month))
                }
                selected={{
                  start: selectedDate,
                  end: selectedDate,
                }}
              />
            </Card>
          </Layout.Section>

          {/* Time Entries Section */}
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <Text as="h2" variant="headingLg">
                  Time Entries for{" "}
                  {selectedDate.toLocaleDateString("en-US", {
                    timeZone: "America/Los_Angeles",
                  })}
                </Text>
                <List>
                  {filteredEntries.length > 0 ? (
                    filteredEntries.map((entry) => (
                      <List.Item key={entry.id}>
                        <Text as="p" variant="headingMd">
                          {entry.project.name} - {entry.task.name}
                        </Text>
                        <Text as="p">Hours: {entry.hours}</Text>
                        <Text as="p">Notes: {entry.notes || "No notes"}</Text>
                      </List.Item>
                    ))
                  ) : (
                    <Text as="p">No time entries for this date.</Text>
                  )}
                </List>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
