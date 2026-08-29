// Express error-handling middleware. Zod validation errors are normally caught
// via safeParse in the controller (so they can return field errors inline),
// but this is a defense-in-depth catch-all for anything thrown elsewhere
// (e.g. a stray parse, or PDF generation failing).
export function errorHandler(err, _req, res, _next) {
  if (err?.name === 'ZodError' && typeof err.flatten === 'function') {
    res.status(400).json({ message: 'Invalid request body', errors: err.flatten().fieldErrors })
    return
  }

  console.error(err)
  res.status(500).json({ message: 'Something went wrong. Please try again.' })
}
