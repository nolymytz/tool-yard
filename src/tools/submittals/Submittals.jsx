import ComingSoon from '../ComingSoon.jsx'
import { FileStack } from 'lucide-react'

export default function Submittals() {
  return (
    <ComingSoon
      Icon={FileStack}
      name="Submittal Shed"
      tagline="Paperwork, without the paper cuts."
      plan={[
        'Track submittals, RFIs, and change orders in one list',
        'Review status lanes: pending, approved, revise & resubmit',
        'Reminders when items are stuck past their due date',
        'Link attachments and export a submittal register',
      ]}
    />
  )
}
