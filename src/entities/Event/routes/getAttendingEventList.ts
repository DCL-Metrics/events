import EventModel from "../model"
import { WithAuth } from "decentraland-gatsby/dist/entities/Auth/middleware"
import { getMyProfileSettings } from "../../ProfileSettings/routes/getMyProfileSettings"

export async function getAttendingEventList(req: WithAuth) {
  const profile = await getMyProfileSettings(req)
  const events = await EventModel.getAttending(req.auth!)
  return events.map((event) => EventModel.toPublic(event, profile))
}
