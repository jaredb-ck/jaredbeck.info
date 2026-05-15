// Root redirect — send visitors to the current active version.
// Update this import when a new version becomes the default.

import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/v1')
}
