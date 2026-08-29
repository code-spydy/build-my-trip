import apiClient from "./client";

export async function fetchDestinations() {
  const response = await apiClient.get("/destinations");

  return response.data;
}
