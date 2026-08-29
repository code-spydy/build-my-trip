// Yup schemas, one per wizard step — the single validation source for the
// Formik-driven forms/ library. Mirrors the rules the old hand-written
// validateStep() used to enforce (see git history) before it was replaced.
import * as Yup from "yup";
import { DURATION_RANGES } from "./constants";

export const tripBasicsSchema = Yup.object({
  tripType: Yup.string().required("Choose a trip type"),
  travelStyle: Yup.string().required("Choose your travel style"),
});

export const travelersSchema = Yup.object({
  travelers: Yup.number()
    .typeError("Enter a number")
    .integer("Enter a whole number")
    .min(1, "At least 1 traveler is required")
    .required("Required"),
  rooms: Yup.number()
    .typeError("Enter a number")
    .integer("Enter a whole number")
    .min(1, "At least 1 room is required")
    .required("Required"),
  adultsPerRoom: Yup.number()
    .typeError("Enter a number")
    .integer("Enter a whole number")
    .min(1, "At least 1 adult per room is required")
    .required("Required"),
});

export const interestsSchema = Yup.object({
  interests: Yup.array().of(Yup.string()).min(1, "Choose at least one interest"),
});

export const durationSchema = Yup.object({
  durationBucket: Yup.string().required("Choose a duration"),
  days: Yup.number()
    .typeError("Choose the number of days")
    .integer("Choose a whole number of days")
    .required("Choose the number of days")
    .test("in-range", "Choose a value within the selected duration", function inRange(value) {
      const range = DURATION_RANGES[this.parent.durationBucket];
      if (!range || value == null) return true;
      return value >= range.min && value <= range.max;
    }),
  flexible: Yup.boolean(),
  departureDate: Yup.string()
    .nullable()
    .test("required-unless-flexible", "Choose a departure date or mark it flexible", function required(value) {
      return this.parent.flexible || Boolean(value);
    })
    .test("not-in-past", "Departure date cannot be in the past", function notInPast(value) {
      if (!value || this.parent.flexible) return true;
      const selected = new Date(`${value}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected >= today;
    }),
});

export const reviewSchema = Yup.object({
  contact: Yup.object({
    name: Yup.string().trim().required("Name is required"),
    phone: Yup.string()
      .matches(/^\d{10}$/, "Enter a valid 10-digit phone number")
      .required("Phone is required"),
  }),
});
