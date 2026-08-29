import apiClient from "./client";

export async function generateItinerary(payload) {
  const response = await apiClient.post("/itinerary/generate", payload);

  return response.data;
}

export async function downloadItineraryPdf(payload) {
  const response = await apiClient.post("/itinerary/pdf", payload, {
    responseType: "blob",
  });

  return response.data;
}
