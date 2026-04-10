import ComingSoon from '../ComingSoon.jsx'
import { Calculator } from 'lucide-react'

export default function Bids() {
  return (
    <ComingSoon
      Icon={Calculator}
      name="BidBoard"
      tagline="See every number at a glance."
      plan={[
        'Kanban of bids from prospect → submitted → awarded/lost',
        'Quick estimate builder with unit costs and markup',
        'Material takeoffs pulled from a reusable item library',
        'Win/loss analytics to sharpen future bids',
      ]}
    />
  )
}
