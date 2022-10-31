import React, { useMemo, useState } from "react"

import { Helmet } from "react-helmet"

import { useLocation } from "@gatsbyjs/reach-router"
import NotFound from "decentraland-gatsby/dist/components/Layout/NotFound"
import Divider from "decentraland-gatsby/dist/components/Text/Divider"
import Paragraph from "decentraland-gatsby/dist/components/Text/Paragraph"
import SubTitle from "decentraland-gatsby/dist/components/Text/SubTitle"
import useAuthContext from "decentraland-gatsby/dist/context/Auth/useAuthContext"
import useAsyncMemo from "decentraland-gatsby/dist/hooks/useAsyncMemo"
import useFormatMessage from "decentraland-gatsby/dist/hooks/useFormatMessage"
import TokenList from "decentraland-gatsby/dist/utils/dom/TokenList"
import { Container } from "decentraland-ui/dist/components/Container/Container"

import { ListEvents } from "../components/Event/ListEvents/ListEvents"
import Navigation, { NavigationTab } from "../components/Layout/Navigation"
import EnabledNotificationModal from "../components/Modal/EnabledNotificationModal"
import { useEventSchedule, useEventsContext } from "../context/Event"
import { ScheduleTheme } from "../entities/Schedule/types"
import mvmfImage from "../images/mvmf.jpg"
import { getSchedules } from "../modules/events"
import { toEventFilters } from "../modules/locations"

import "./index.css"
import "./schedule.css"

export type IndexPageState = {
  updating: Record<string, boolean>
}

export default function IndexPage() {
  const l = useFormatMessage()
  const [, accountState] = useAuthContext()
  const location = useLocation()
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  )

  const [schedules] = useAsyncMemo(getSchedules)
  const schedule = useMemo(
    () => schedules?.find((schedule) => schedule.id === params.get("id")),
    [schedules, params.get("id")]
  )

  const [all, state] = useEventsContext()
  const events = useEventSchedule(all, params.get("id"))
  const filters = useMemo(() => toEventFilters(params), [params])
  const loading = accountState.loading || state.loading
  const [enabledNotification, setEnabledNotification] = useState(false)

  return (
    <>
      <Helmet>
        <title>{schedule?.name || l("social.home.title") || ""}</title>
        <meta
          name="description"
          content={schedule?.description || l("social.home.description") || ""}
        />

        <meta
          property="og:title"
          content={schedule?.name || l("social.home.title") || ""}
        />
        <meta
          property="og:description"
          content={schedule?.description || l("social.home.description") || ""}
        />
        <meta
          property="og:image"
          content={schedule?.image || l("social.home.image") || ""}
        />
        <meta property="og:site" content={l("social.home.site") || ""} />

        <meta
          name="twitter:title"
          content={schedule?.name || l("social.home.title") || ""}
        />
        <meta
          name="twitter:description"
          content={schedule?.description || l("social.home.description") || ""}
        />
        <meta
          name="twitter:image"
          content={schedule?.image || l("social.home.image") || ""}
        />
        <meta name="twitter:card" content={l("social.home.card") || ""} />
        <meta name="twitter:creator" content={l("social.home.creator") || ""} />
        <meta name="twitter:site" content={l("social.home.site") || ""} />
      </Helmet>
      <EnabledNotificationModal
        open={enabledNotification}
        onClose={() => setEnabledNotification(false)}
      />
      <Navigation activeTab={schedule && NavigationTab.Schedule} search />

      <div
        className={TokenList.join([
          "scheduled-events",
          !!schedule?.theme && "scheduled-events--" + schedule.theme,
        ])}
      >
        <Container>
          {!loading && !schedule && <NotFound />}
          {!loading && schedule && schedule.theme === null && (
            <SubTitle className="events__all-events-title">
              {schedule?.name}
            </SubTitle>
          )}

          {!loading &&
            schedule &&
            schedule.theme === ScheduleTheme.MetaverseFestival2022 && (
              <div
                className={TokenList.join([
                  "scheduled-events__title",
                  !!schedule?.theme &&
                    "scheduled-events__title--" + schedule.theme,
                ])}
              >
                <img src={mvmfImage} width="930" height="290" />
              </div>
            )}

          <ListEvents
            disabledFilters={true}
            loading={loading}
            events={events}
            filters={filters}
          />
        </Container>
      </div>
    </>
  )
}
