import ComingSoon from '../ComingSoon.jsx'
import { NotebookPen } from 'lucide-react'

export default function DailyLogs() {
  return (
    <ComingSoon
      Icon={NotebookPen}
      name="Daily Drift"
      tagline="End-of-day in under a minute."
      plan={[
        'Log crew hours by trade with one-tap presets',
        'Auto-pull weather and site conditions by location',
        'Track deliveries, visitors, and incidents',
        'Email the daily log to the PM at 5pm automatically',
      ]}
    />
  )
}
