// Central registry of every micro app in the Tool Yard.
// Add a new app here and it automatically appears on the landing grid
// and gets a route in App.jsx.
//
// status: 'live' | 'beta' | 'soon'

import EquipTrack from './equiptrack/EquipTrack.jsx'
import PunchList from './punchlist/PunchList.jsx'
import DailyLogs from './dailylogs/DailyLogs.jsx'
import Submittals from './submittals/Submittals.jsx'
import Bids from './bids/Bids.jsx'

import {
  HardHat, ClipboardCheck, NotebookPen, FileStack, Calculator
} from 'lucide-react'

export const tools = [
  {
    slug: 'equiptrack',
    name: 'EquipTrack',
    tagline: 'Know where every machine is.',
    description:
      'Track equipment across jobsites — status, location, operator, and service history. The first tool in the yard.',
    icon: HardHat,
    status: 'live',
    accent: 'safety',
    component: EquipTrack,
  },
  {
    slug: 'punchlist',
    name: 'Punch Pro',
    tagline: 'Walk it. List it. Close it.',
    description:
      'Punch lists, inspections, and QA walkthroughs with photos and sign-offs.',
    icon: ClipboardCheck,
    status: 'soon',
    accent: 'caution',
    component: PunchList,
  },
  {
    slug: 'dailylogs',
    name: 'Daily Drift',
    tagline: 'End-of-day in under a minute.',
    description:
      'Crew hours, weather, deliveries, and notes — a fast daily log for foremen and superintendents.',
    icon: NotebookPen,
    status: 'soon',
    accent: 'safety',
    component: DailyLogs,
  },
  {
    slug: 'submittals',
    name: 'Submittal Shed',
    tagline: 'Paperwork, without the paper cuts.',
    description:
      'Track submittals, RFIs, and change orders with review status and reminders.',
    icon: FileStack,
    status: 'soon',
    accent: 'caution',
    component: Submittals,
  },
  {
    slug: 'bids',
    name: 'BidBoard',
    tagline: 'See every number at a glance.',
    description:
      'Track bids, estimates, and material takeoffs from prospect to award.',
    icon: Calculator,
    status: 'soon',
    accent: 'safety',
    component: Bids,
  },
]

export const getTool = (slug) => tools.find((t) => t.slug === slug)
