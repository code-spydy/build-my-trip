// Zod schema for the generate/pdf request body — the single gate for untrusted input.
import { z } from 'zod'
import { destinations } from '../data/destinations.js'
import { TRIP_TYPES, TRAVEL_STYLES, INTERESTS, DURATION_RANGES } from '../utils/constants.js'

const destinationIds = new Set(destinations.map((destination) => destination.id))

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be a 10-digit number'),
})

export const itinerarySchema = z
  .object({
    destinationId: z
      .number()
      .int()
      .refine((id) => destinationIds.has(id), { message: 'Unknown destination' }),
    tripType: z.enum(TRIP_TYPES),
    travelStyle: z.enum(TRAVEL_STYLES),
    travelers: z.number().int().min(1),
    rooms: z.number().int().min(1),
    adultsPerRoom: z.number().int().min(1),
    // Non-empty subset of the known interests. Deliberately does NOT require
    // every selected interest to exist at the destination — Tier 2/3 in the
    // generator handle that gap.
    interests: z.array(z.enum(INTERESTS)).min(1, 'Select at least one interest'),
    durationBucket: z.enum(Object.keys(DURATION_RANGES)),
    days: z.number().int(),
    departureDate: z.string().nullable().optional(),
    flexible: z.boolean(),
    contact: contactSchema,
  })
  .superRefine((data, ctx) => {
    const range = DURATION_RANGES[data.durationBucket]
    if (range && (data.days < range.min || data.days > range.max)) {
      ctx.addIssue({
        code: 'custom',
        path: ['days'],
        message: `days must be between ${range.min} and ${range.max} for the "${data.durationBucket}" bucket`,
      })
    }

    if (!data.flexible) {
      if (!data.departureDate) {
        ctx.addIssue({
          code: 'custom',
          path: ['departureDate'],
          message: 'departureDate is required unless the trip is flexible',
        })
      } else {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const departure = new Date(data.departureDate)

        if (Number.isNaN(departure.getTime()) || departure < today) {
          ctx.addIssue({
            code: 'custom',
            path: ['departureDate'],
            message: 'departureDate must be today or later',
          })
        }
      }
    }
  })
