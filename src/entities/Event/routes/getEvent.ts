import EventModel from "../model"
import EventAttendee from "../../EventAttendee/model"
import isUUID from "validator/lib/isUUID"
import RequestError from "decentraland-gatsby/dist/entities/Route/error"
import { EventAttributes, GetEventParams } from "../types"
import { getMyProfileSettings } from "../../ProfileSettings/routes/getMyProfileSettings"
import { oncePerRequest } from "decentraland-gatsby/dist/entities/Route/utils"
import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import {
  canApproveAnyEvent,
  canEditAnyEvent,
} from "../../ProfileSettings/utils"
import { ProfileSettingsAttributes } from "../../ProfileSettings/types"
import { createValidator } from "decentraland-gatsby/dist/entities/Route/validate"
import { getEventParamsSchema } from "../schemas"
import isAdmin from "decentraland-gatsby/dist/entities/Auth/isAdmin"

export const validateGetEventParams =
  createValidator<GetEventParams>(getEventParamsSchema)

export const getEvent = oncePerRequest(async (req: WithAuth) => {
  const user = req.auth
  const profile = await getMyProfileSettings(req)
  const params = validateGetEventParams(req.params)
  if (!isUUID(params.event_id)) {
    throw new RequestError(
      `Not found event "${params.event_id}"`,
      RequestError.NotFound
    )
  }

  const event = EventModel.build(
    await EventModel.findOne<EventAttributes>({ id: params.event_id })
  )

  if (!event) {
    throw new RequestError(
      `Not found event "${params.event_id}"`,
      RequestError.NotFound
    )
  }

  if (!event.approved) {
    if (!user) {
      throw new RequestError(
        `Not found event "${params.event_id}"`,
        RequestError.NotFound
      )
    }

    if (!canReadEvent(event, profile)) {
      throw new RequestError(
        `Not found event "${params.event_id}"`,
        RequestError.NotFound
      )
    }
  }

  let attending = false
  if (user) {
    const count = await EventAttendee.count({
      user,
      event_id: params.event_id,
    })

    attending = !!count
  }

  return { ...EventModel.toPublic(event, profile), attending }
})

function canReadEvent(
  event: EventAttributes,
  profile: ProfileSettingsAttributes
) {
  return (
    isAdmin(profile.user) ||
    event.user === profile.user ||
    canApproveAnyEvent(profile) ||
    canEditAnyEvent(profile)
  )
}
