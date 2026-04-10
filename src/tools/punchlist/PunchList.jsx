import ComingSoon from '../ComingSoon.jsx'
import { ClipboardCheck } from 'lucide-react'

export default function PunchList() {
  return (
    <ComingSoon
      Icon={ClipboardCheck}
      name="Punch Pro"
      tagline="Walk it. List it. Close it."
      plan={[
        'Create punch lists scoped to rooms, floors, or trades',
        'Attach photos and markup directly from your phone',
        'Assign items to subs with due dates and sign-off',
        'Export a PDF close-out report for the owner',
      ]}
    />
  )
}
