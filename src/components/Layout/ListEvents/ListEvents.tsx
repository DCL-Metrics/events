import React, { useCallback, useMemo, useState } from "react"

import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import { Card } from "decentraland-ui/dist/components/Card/Card"
import { SliderField } from "decentraland-ui/dist/components/SliderField/SliderField"
import {
  SessionEventAttributes,
  EventType,
} from "../../../entities/Event/types"
import EventCard from "../../Event/EventCard/EventCard"
import Time from "decentraland-gatsby/dist/utils/date/Time"
import { useProfileSettingsContext } from "../../../context/ProfileSetting"
import { Row } from "../Row/Row"
import { navigate } from "decentraland-gatsby/dist/plugins/intl"
import { Column } from "../Column/Column"
import {
  ToggleBox,
  ToggleBoxItem,
} from "decentraland-ui/dist/components/ToggleBox/ToggleBox"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import useListEventsByMonth from "../../../hooks/useListEventsByMonth"
import useFeatureFlagContext from "decentraland-gatsby/dist/context/FeatureFlag/useFeatureFlagContext"
import {
  FilterCategoryVariant,
  FilterTimeVariant,
  FilterTypeVariant,
  Flags,
} from "../../../modules/features"
import useTrackContext from "decentraland-gatsby/dist/context/Track/useTrackContext"
import { SegmentEvent } from "../../../modules/segment"
import { EventFilters, fromEventFilters, url } from "../../../modules/locations"
import { getEventType } from "../../../entities/Event/utils"
import { showTimezoneLabel } from "../../../modules/date"
import useListEventsCategories from "../../../hooks/useListEventsCategories"
import { navigateEventDetail } from "../../../modules/events"
import { useCategoriesContext } from "../../../context/Category"
import { useLocation } from "@gatsbyjs/reach-router"
import useListEventsFiltered from "../../../hooks/useListEventsFiltered"
import "./ListEvents.css"
import { ALL_EVENT_CATEGORY } from "../../../entities/EventCategory/types"

export type ListEventsProps = {
  events: SessionEventAttributes[]
  filters: EventFilters
  loading?: boolean
  className?: string
  disabledFilters?: boolean
}

const typeItems = [
  {
    title: "All events",
    description: "Every event in Decentraland",
    value: EventType.All,
  },
  {
    title: "One time event",
    description: "Events which happen once",
    value: EventType.One,
  },
  {
    title: "Recurring event",
    description: "Events which happen on more than one day",
    value: EventType.Recurrent,
  },
]

export const ListEvents = (props: ListEventsProps) => {
  const { className, loading, disabledFilters } = props
  const [settings] = useProfileSettingsContext()
  const location = useLocation()
  const track = useTrackContext()
  const l = useFormatMessage()
  const [ff] = useFeatureFlagContext()
  const [categories] = useCategoriesContext()
  const filteredEvents = useListEventsFiltered(
    props.events,
    props.filters,
    settings
  )
  const eventsByMonth = useListEventsByMonth(filteredEvents)
  const categoriesFiltered = useListEventsCategories(props.events, categories)

  // const [event] = useEventIdContext(params.get("event"))

  // const [eventTime, setEventTime] = useState<EventTimeParams>(timeFilter)

  const categoryItems = useMemo(() => {
    let categoriesToReturn = [
      {
        title: "All",
        description: "",
        value: "all",
      },
    ]

    if (categoriesFiltered) {
      const categoriesOptions = categoriesFiltered?.map((category) => ({
        title: l(`page.events.categories.${category.name}`),
        description: "",
        value: category.name,
      }))

      categoriesToReturn = [...categoriesToReturn, ...categoriesOptions]
    }

    return categoriesToReturn
  }, [categoriesFiltered, props.filters.category])

  const timeRangeLabel = useMemo(() => {
    const from =
      props.filters.timeFrom === 24 * 60
        ? "24:00"
        : Time.duration(props.filters.timeFrom ?? 0, "minutes").format("HH:mm")
    const to =
      props.filters.timeTo === 24 * 60 || props.filters.timeTo === undefined
        ? "24:00"
        : Time.duration(props.filters.timeTo, "minutes").format("HH:mm")

    const timezone = showTimezoneLabel(Time.from(), settings?.use_local_time)
    return `${from} - ${to} ${timezone}`
  }, [props.filters])

  const timeRangeValue = useMemo(
    () =>
      [
        (props.filters.timeFrom ?? 0) / 30,
        (props.filters.timeTo ?? 24 * 60) / 30,
      ] as const,
    [props.filters]
  )

  const showFilterByType = useMemo(
    () =>
      ff.name<FilterTypeVariant>(
        Flags.FilterTypeVariant,
        FilterTypeVariant.disabled
      ) === FilterTypeVariant.enabled,
    [ff]
  )

  const showFilterByCategory = useMemo(
    () =>
      ff.name<FilterCategoryVariant>(
        Flags.FilterCategoryVariant,
        FilterCategoryVariant.disabled
      ) === FilterCategoryVariant.enabled && categoriesFiltered.length > 0,
    [ff, categoriesFiltered]
  )

  const showFilterByTime = useMemo(
    () =>
      ff.name<FilterTimeVariant>(
        Flags.FilterTimeVariant,
        FilterTimeVariant.disabled
      ) === FilterTimeVariant.enabled,
    [ff]
  )

  const showFilters =
    !disabledFilters &&
    (showFilterByType || showFilterByTime || showFilterByCategory)

  const cardItemsPerRow = showFilters ? 2 : 3

  const handleTypeChange = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, item: ToggleBoxItem) => {
      const type = getEventType(item.value as string)
      const newFilters = { ...props.filters, type }
      const newParams = fromEventFilters(
        newFilters,
        new URLSearchParams(location.search)
      )
      track(SegmentEvent.Filter, newFilters)
      navigate(url(location.pathname, newParams))
    },
    [location.pathname, location.search, props.filters]
  )

  const handleCategoryChange = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, item: ToggleBoxItem) => {
      const category = item.value as string
      const newFilters = { ...props.filters, category }
      const newParams = fromEventFilters(
        newFilters,
        new URLSearchParams(location.search)
      )
      track(SegmentEvent.Filter, newFilters)
      navigate(url(location.pathname, newParams))
    },
    [location.pathname, location.search, props.filters]
  )

  const handleRangeChange = useCallback(
    (
      ev: React.ChangeEvent<HTMLInputElement>,
      [from, to]: readonly [number, number]
    ) => {
      const newFilters = {
        ...props.filters,
        timeFrom: from * 30,
        timeTo: to * 30,
      }
      const newParams = fromEventFilters(
        newFilters,
        new URLSearchParams(location.search)
      )
      track(SegmentEvent.Filter, newFilters)
      navigate(url(location.pathname, newParams))
    },
    []
  )

  const handleRangeAfterChange = useCallback(
    (
      ev: React.MouseEvent<HTMLInputElement, MouseEvent>,
      [from, to]: readonly [number, number]
    ) => {
      const newFilters = {
        ...props.filters,
        timeFrom: from * 30,
        timeTo: to * 30,
      }
      const newParams = fromEventFilters(
        newFilters,
        new URLSearchParams(location.search)
      )
      track(SegmentEvent.Filter, newFilters)
      navigate(url(location.pathname, newParams))
    },
    []
  )

  if (loading) {
    return (
      <div className={className}>
        <div>
          <div className="GroupTitle">
            <SubTitle>
              {Time.from(Date.now(), {
                utc: !settings?.use_local_time,
              }).format("MMMM")}
            </SubTitle>
          </div>
          <Card.Group>
            <EventCard loading />
            <EventCard loading />
            <EventCard loading />
            <EventCard loading />
            <EventCard loading />
            <EventCard loading />
          </Card.Group>
        </div>
      </div>
    )
  }

  return (
    <>
      {!loading && (
        <Row>
          {showFilters && (
            <Column align="left" className="sidebar">
              {showFilterByType && (
                <ToggleBox
                  header="Type"
                  onClick={handleTypeChange}
                  items={typeItems}
                  value={props.filters.type}
                />
              )}

              {showFilterByCategory && (
                <ToggleBox
                  header="Category"
                  onClick={handleCategoryChange}
                  items={categoryItems}
                  value={props.filters.category || ALL_EVENT_CATEGORY}
                  borderless
                />
              )}

              {showFilterByTime && (
                <SliderField
                  range={true}
                  header="Event Time"
                  min={0}
                  max={48}
                  defaultValue={timeRangeValue}
                  onChange={handleRangeChange}
                  onMouseUp={handleRangeAfterChange}
                  label={timeRangeLabel}
                />
              )}
            </Column>
          )}
          <Column align="right" grow={true}>
            {!loading && filteredEvents.length === 0 && (
              <div>
                <Divider />
                <Paragraph secondary style={{ textAlign: "center" }}>
                  {l("page.events.not_found")}
                </Paragraph>
                <Divider />
              </div>
            )}

            {eventsByMonth.length > 0 &&
              eventsByMonth.map(([date, events]) => (
                <div key={"month:" + date.toJSON()}>
                  <div className="GroupTitle">
                    <SubTitle>
                      {Time.from(date, {
                        utc: !settings?.use_local_time,
                      }).format("MMMM")}
                    </SubTitle>
                  </div>
                  <Card.Group itemsPerRow={cardItemsPerRow}>
                    {events.map((event) => (
                      <EventCard
                        key={"event:" + event.id}
                        event={event}
                        onClick={navigateEventDetail}
                      />
                    ))}
                  </Card.Group>
                </div>
              ))}
          </Column>
        </Row>
      )}
    </>
  )
}
