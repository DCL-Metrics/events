import { Request } from 'express';
import isUUID from 'validator/lib/isUUID';
import param from '../Route/param';
import { EventAttributes } from './types';
import Event from './model';
import RequestError from '../Route/error';
import middleware from "../Middleware/middleware";
import isAdmin from '../Auth/isAdmin';

export function getEventIdParam(req: Request) {
  return param(req, 'eventId', isUUID);
}

export type WithEvent<R extends Request = Request> = R & {
  event: EventAttributes
}

export type WithEventOptions = {
  owner?: boolean,
  enforce?: { [key: string]: any }
}

export function withEvent(options: WithEventOptions = {}) {
  return middleware(async (req) => {
    const event_id = getEventIdParam(req)
    const enforce = options.enforce || {}
    const event = await Event.findOne<EventAttributes>({ id: event_id, ...enforce })

    if (!event) {
      throw new RequestError(`Not found event "${event_id}"`, RequestError.StatusCode.NotFound)
    }

    if (options.owner) {
      const user = (req as any).auth

      if (!user) {
        throw new RequestError(`Unauthorized`, RequestError.StatusCode.Unauthorized)
      }

      if (event.user !== user && !isAdmin(user)) {
        throw new RequestError(`Forbidden`, RequestError.StatusCode.Forbidden)
      }
    }

    Object.assign(req, { event })
  })
}
