
// This file used to point to a deployed backend, but now we are using Genkit flows directly.
// This file can be removed, but we'll keep it for simplicity to avoid having to
// update all the component files that import it. The API calls will be
// intercepted and handled locally by the flow definitions.

export const getApiUrl = (endpoint: string) => {
  // This function is now effectively a no-op, but we keep it
  // to avoid breaking imports in the component files.
  // The actual "routing" is handled by Next.js and server actions.
  return `/api/${endpoint}`;
};
