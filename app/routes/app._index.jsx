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
  InlineGrid,
  Box,
  ProgressBar,
} from "@shopify/polaris";
import { ClockIcon } from "@shopify/polaris-icons";
import { useState } from "react";

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

    // Fetch project budget report data from Harvest API
    const projectReportResponse = await fetch(
      "https://api.harvestapp.com/api/v2/reports/project_budget?is_active=true",
      {
        headers: {
          Authorization: `Bearer ${process.env.HARVEST_API_TOKEN}`,
          "Harvest-Account-ID": process.env.HARVEST_ACCOUNT_ID,
          "User-Agent": "Harvest Project Tracker (your_email@example.com)",
        },
      },
    );

    if (!userResponse.ok || !projectReportResponse.ok) {
      throw new Error("Failed to fetch data from Harvest API");
    }

    const userData = await userResponse.json();
    const projectReportData = await projectReportResponse.json();

    return json({ user: userData, projects: projectReportData.results });
  } catch (error) {
    console.error("Error fetching data from Harvest API:", error);
    throw new Error("Failed to fetch data from Harvest API");
  }
};

export default function Index() {
  const { user, projects } = useLoaderData();

  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleDateChange = (date) => {
    setSelectedDate(new Date(date.start));
  };

  return (
    <Page fullWidth>
      <BlockStack gap="500">
        <InlineGrid columns={["oneThird", "twoThirds"]}>
          {/* Left Column: User Information and Date Picker */}
          <Layout.Section>
            <Card background="bg-surface-warning" padding="500">
              <BlockStack gap="500">
                <BlockStack>
                  <ClockIcon width={40} source={ClockIcon} tone="base" />
                  <Text as="h1" variant="heading2xl">
                    Harvest Project Tracker
                  </Text>
                </BlockStack>
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

            <Box paddingBlockStart="400">
              <Card>
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
            </Box>
          </Layout.Section>

          {/* Right Column: Project Data */}
          <Layout.Section>
            <Box minHeight="1200px">
              <Card>
                <BlockStack gap="500">
                  <Text as="h2" variant="headingLg">
                    Active Projects Details
                  </Text>
                  <List>
                    {projects.length > 0 ? (
                      projects.map((project) => {
                        const budget = project.budget || 0;
                        const budgetSpent = project.budget_spent || 0;
                        const budgetRemaining = project.budget_remaining || 0;
                        const progress =
                          budget > 0 ? (budgetSpent / budget) * 100 : 0;
                        const progressBarTone =
                          budgetSpent > budget ? "critical" : "highlight";

                        return (
                          <List.Item key={project.project_id}>
                            <BlockStack gap="200">
                              <Text as="p" variant="headingMd">
                                Client:{" "}
                                {project.client_name || "Unknown Client"}
                              </Text>
                              <Text as="p">
                                Project:{" "}
                                {project.project_name || "Unnamed Project"}
                              </Text>
                              <Text as="p" variant="headingSm">
                                Budget Progress:
                              </Text>
                              <Text as="p">
                                Spent: {budgetSpent} hours / {budget} hours
                              </Text>
                              <div>
                                <ProgressBar
                                  progress={progress}
                                  tone={progressBarTone}
                                />
                              </div>
                              <Text as="p">
                                Remaining Hours: {budgetRemaining} hours
                              </Text>
                            </BlockStack>
                          </List.Item>
                        );
                      })
                    ) : (
                      <Text as="p">No projects available.</Text>
                    )}
                  </List>
                </BlockStack>
              </Card>
            </Box>
          </Layout.Section>
        </InlineGrid>
      </BlockStack>
    </Page>
  );
}
