import API from "decentraland-gatsby/dist/utils/api/API"

import { EventType } from "../entities/Event/types"
import {
  fromEventTime,
  getEventType,
  toEventTime,
} from "../entities/Event/utils"
import { ALL_EVENT_CATEGORY } from "../entities/EventCategory/types"

const GATSBY_BASE_URL = process.env.GATSBY_BASE_URL || "/"

export enum EventView {
  Attendees = "attendees",
}

export enum SubmitView {
  Edit = "edit",
  Clone = "clone",
}

export type EventFilters = {
  search?: string | null
  category?: string | null
  type?: EventType
  timeFrom?: number
  timeTo?: number
}

export function toEventFilters(params: URLSearchParams): EventFilters {
  const [timeFrom, timeTo] = fromEventTime(
    params.get("time-from"),
    params.get("time-to")
  )

  return {
    search: params.get("search"),
    category: params.get("category"),
    type: getEventType(params.get("type")),
    timeFrom,
    timeTo,
  }
}

export function fromEventFilters(
  filters: EventFilters,
  params = new URLSearchParams()
): URLSearchParams {
  if (filters.search) {
    params.set("search", filters.search)
  } else {
    params.delete("search")
  }

  if (filters.category && filters.category != ALL_EVENT_CATEGORY) {
    params.set("category", filters.category)
  } else {
    params.delete("category")
  }

  if (filters.type && filters.type !== EventType.All) {
    params.set("type", filters.type)
  } else {
    params.delete("type")
  }

  if (Number.isFinite(filters.timeFrom) && Number.isFinite(filters.timeTo)) {
    const [timeFrom, timeTo] = toEventTime(filters.timeFrom, filters.timeTo)
    if (timeFrom !== "0000") {
      params.set("time-from", timeFrom)
    } else {
      params.delete("time-from")
    }

    if (timeTo !== "2400") {
      params.set("time-to", timeTo)
    } else {
      params.delete("time-to")
    }
  } else {
    params.delete("time-from")
    params.delete("time-to")
  }

  return params
}

export function url(
  path: string,
  query?: Record<string, string> | URLSearchParams
) {
  return API.url(GATSBY_BASE_URL, path, query)
}

export default {
  events: (filters: EventFilters = {}) => url("/", fromEventFilters(filters)),
  event: (id: string) => url("/event/", { id }),
  myEvents: () => url("/me/"),
  pendingEvents: () => url("/pending/"),
  schedule: (id: string) => url("/schedule/", { id }),

  submitEvent: () => url("/submit/"),
  editEvent: (event: string) =>
    url("/submit/", { event, view: SubmitView.Edit }),
  cloneEvent: (event: string) =>
    url("/submit/", { event, view: SubmitView.Clone }),

  submitSchedule: () => url("/submit/schedule/"),
  // editSchedule: (schedule: string) => url("/submit/", { schedule, view: SubmitView.Edit }),
  // cloneSchedule: (shcedule: string) => url("/submit/", { shcedule, view: SubmitView.Clone }),

  settings: () => url("/settings/"),

  docs: () => url("/docs/"),
}
